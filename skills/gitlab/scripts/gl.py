#!/usr/bin/env -S uv run --quiet
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-gitlab>=5.0", "click>=8.0"]
# ///
"""
GitLab CLI for code review workflows.

Structured JSON output for agent consumption.
Auto-detects project from git remote.

Environment:
    GITLAB_HOST: GitLab instance URL (default: https://gitlab.com)
    GITLAB_TOKEN: Personal access token
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from typing import Any, NoReturn

import click
import gitlab
from gitlab.exceptions import GitlabError, GitlabAuthenticationError


# =============================================================================
# Output Helpers
# =============================================================================


def output_success(data: Any) -> None:
    print(json.dumps({"status": "success", "data": data}, indent=2, default=str))
    sys.exit(0)


def output_error(message: str, code: int = 1) -> NoReturn:
    print(json.dumps({"status": "error", "message": message}), file=sys.stderr)
    sys.exit(code)


# =============================================================================
# GitLab Client
# =============================================================================


def get_client() -> gitlab.Gitlab:
    host = os.environ.get("GITLAB_HOST", "https://gitlab.com")
    token = os.environ.get("GITLAB_TOKEN")
    ssl_verify = os.environ.get("GITLAB_SSL_VERIFY", "true").lower() not in (
        "false",
        "0",
        "no",
    )

    if not token:
        output_error("GITLAB_TOKEN environment variable not set")

    try:
        gl = gitlab.Gitlab(url=host, private_token=token, ssl_verify=ssl_verify)
        gl.auth()
        return gl
    except GitlabAuthenticationError as e:
        output_error(f"Authentication failed: {e}")
    except Exception as e:
        output_error(f"Failed to connect to GitLab: {e}")


def get_current_user(gl: gitlab.Gitlab) -> Any:
    return gl.user


# =============================================================================
# Project Detection
# =============================================================================


def detect_project_path() -> str | None:
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            return None

        url = result.stdout.strip()
        return parse_gitlab_url(url)
    except Exception:
        return None


def parse_gitlab_url(url: str) -> str | None:
    # SSH: git@gitlab.com:group/project.git
    ssh_match = re.match(r"git@[^:]+:(.+?)(?:\.git)?$", url)
    if ssh_match:
        return ssh_match.group(1)

    # HTTPS: https://gitlab.com/group/project.git
    https_match = re.match(r"https?://[^/]+/(.+?)(?:\.git)?$", url)
    if https_match:
        return https_match.group(1)

    return None


def get_project(gl: gitlab.Gitlab, project_path: str | None) -> Any:
    if not project_path:
        project_path = detect_project_path()

    if not project_path:
        output_error("Could not detect project. Use --project or run from a git repository.")

    try:
        return gl.projects.get(project_path)
    except GitlabError as e:
        output_error(f"Project not found: {project_path} - {e}")


def parse_csv_items(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def resolve_user_id(gl: gitlab.Gitlab, username: str, current_user: Any | None = None) -> int:
    if username == "me":
        if current_user is None:
            current_user = get_current_user(gl)
        return current_user.id

    users = gl.users.list(username=username)
    if users:
        return users[0].id

    output_error(f"User not found: {username}")


def resolve_milestone_id(project: Any, milestone_title: str) -> int:
    milestones = project.milestones.list(title=milestone_title)
    if milestones:
        return milestones[0].id

    output_error(f"Milestone not found: {milestone_title}")


# =============================================================================
# MR Helpers
# =============================================================================


def get_mr(project: Any, mr_iid: int) -> Any:
    try:
        return project.mergerequests.get(mr_iid)
    except GitlabError as e:
        output_error(f"MR !{mr_iid} not found: {e}")


def mr_to_dict(mr: Any) -> dict:
    return {
        "iid": mr.iid,
        "title": mr.title,
        "state": mr.state,
        "author": mr.author.get("username") if mr.author else None,
        "assignees": [a.get("username") for a in (mr.assignees or [])],
        "reviewers": [r.get("username") for r in (mr.reviewers or [])],
        "source_branch": mr.source_branch,
        "target_branch": mr.target_branch,
        "draft": mr.draft,
        "web_url": mr.web_url,
        "has_conflicts": mr.has_conflicts,
        "pipeline_status": getattr(mr, "head_pipeline", {}).get("status")
        if getattr(mr, "head_pipeline", None)
        else None,
        "created_at": mr.created_at,
        "updated_at": mr.updated_at,
    }


def get_mr_diff_refs(mr: Any) -> dict:
    try:
        diffs = mr.diffs.list(get_all=False)
        if not diffs:
            output_error("No diffs found for this MR")

        latest_diff = diffs[0]
        return {
            "base_sha": latest_diff.base_commit_sha,
            "head_sha": latest_diff.head_commit_sha,
            "start_sha": latest_diff.start_commit_sha,
        }
    except GitlabError as e:
        output_error(f"Failed to get MR diff refs: {e}")


def apply_draft_title_state(title: str, draft: bool, ready: bool) -> str:
    prefix = "Draft: "
    if draft:
        return title if title.startswith(prefix) else f"{prefix}{title}"
    if ready:
        return title[len(prefix) :] if title.startswith(prefix) else title
    return title


# =============================================================================
# CLI Structure
# =============================================================================


@click.group()
@click.option(
    "--project",
    "-p",
    envvar="GITLAB_PROJECT",
    help="Project path (auto-detected from git)",
)
@click.pass_context
def cli(ctx, project: str | None):
    """GitLab CLI for code review workflows."""
    ctx.ensure_object(dict)
    ctx.obj["project_path"] = project


# =============================================================================
# Project Commands
# =============================================================================


@cli.command("detect")
def project_detect():
    """Detect project from git remote."""
    path = detect_project_path()
    if path:
        output_success({"project": path})
    else:
        output_error("Could not detect project from git remote")


@cli.command("whoami")
def whoami():
    """Show current authenticated user."""
    gl = get_client()
    user = get_current_user(gl)
    output_success(
        {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": getattr(user, "email", None),
            "web_url": user.web_url,
        }
    )


# =============================================================================
# MR Commands
# =============================================================================


@cli.group("mr")
def mr_group():
    """Merge request commands."""
    pass


@mr_group.command("list")
@click.option(
    "--state",
    type=click.Choice(["opened", "closed", "merged", "all"]),
    default="opened",
)
@click.option("--author", help="Filter by author username or 'me'")
@click.option("--reviewer", help="Filter by reviewer username or 'me'")
@click.option("--assignee", help="Filter by assignee username or 'me'")
@click.option("--limit", default=20, help="Max results")
@click.pass_context
def mr_list(
    ctx,
    state: str,
    author: str | None,
    reviewer: str | None,
    assignee: str | None,
    limit: int,
):
    """List merge requests."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    user = get_current_user(gl)

    kwargs: dict[str, Any] = {"state": state, "per_page": limit}

    if author == "me":
        kwargs["author_id"] = user.id
    elif author:
        kwargs["author_username"] = author

    if reviewer == "me":
        kwargs["reviewer_id"] = user.id
    elif reviewer:
        kwargs["reviewer_username"] = reviewer

    if assignee == "me":
        kwargs["assignee_id"] = user.id
    elif assignee:
        kwargs["assignee_username"] = assignee

    try:
        mrs = project.mergerequests.list(**kwargs)
        output_success([mr_to_dict(mr) for mr in mrs])
    except GitlabError as e:
        output_error(f"Failed to list merge requests: {e}")


@mr_group.command("info")
@click.argument("mr_iid", type=int)
@click.pass_context
def mr_info(ctx, mr_iid: int):
    """Get MR details."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    data = mr_to_dict(mr)
    data["description"] = mr.description
    data["labels"] = mr.labels
    data["milestone"] = mr.milestone.get("title") if mr.milestone else None
    data["merge_status"] = mr.merge_status
    data["approvals_required"] = getattr(mr, "approvals_required", None)
    data["approvals_left"] = getattr(mr, "approvals_left", None)

    output_success(data)


@mr_group.command("diff")
@click.argument("mr_iid", type=int)
@click.option("--path-filter", help="Filter files by glob pattern")
@click.pass_context
def mr_diff(ctx, mr_iid: int, path_filter: str | None):
    """Get MR diff content."""
    import fnmatch

    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        changes = mr.changes()
        files = []

        for change in changes.get("changes", []):
            path = change.get("new_path") or change.get("old_path")

            if path_filter and not fnmatch.fnmatch(path, path_filter):
                continue

            files.append(
                {
                    "old_path": change.get("old_path"),
                    "new_path": change.get("new_path"),
                    "new_file": change.get("new_file", False),
                    "deleted_file": change.get("deleted_file", False),
                    "renamed_file": change.get("renamed_file", False),
                    "diff": change.get("diff"),
                }
            )

        diff_refs = get_mr_diff_refs(mr)
        output_success(
            {
                "mr_iid": mr_iid,
                "diff_refs": diff_refs,
                "files": files,
            }
        )
    except GitlabError as e:
        output_error(f"Failed to get MR diff: {e}")


@mr_group.command("discussions")
@click.argument("mr_iid", type=int)
@click.option("--unresolved-only", is_flag=True, help="Show only unresolved threads")
@click.pass_context
def mr_discussions(ctx, mr_iid: int, unresolved_only: bool):
    """List MR discussions/threads."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        discussions = mr.discussions.list(get_all=True)
        result = []

        for d in discussions:
            if unresolved_only and getattr(d, "resolved", True):
                continue

            notes = []
            for note in d.attributes.get("notes", []):
                notes.append(
                    {
                        "id": note.get("id"),
                        "author": note.get("author", {}).get("username"),
                        "body": note.get("body"),
                        "created_at": note.get("created_at"),
                        "resolvable": note.get("resolvable", False),
                        "resolved": note.get("resolved", False),
                        "position": note.get("position"),
                    }
                )

            result.append(
                {
                    "id": d.id,
                    "resolved": getattr(d, "resolved", None),
                    "notes": notes,
                }
            )

        output_success(result)
    except GitlabError as e:
        output_error(f"Failed to get MR discussions: {e}")


# =============================================================================
# MR Comment Commands
# =============================================================================


@mr_group.command("comment")
@click.argument("mr_iid", type=int)
@click.argument("message")
@click.pass_context
def mr_comment(ctx, mr_iid: int, message: str):
    """Add general comment to MR."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        note = mr.notes.create({"body": message})
        output_success(
            {
                "note_id": note.id,
                "message": "Comment added",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to add comment: {e}")


@mr_group.command("line-comment")
@click.argument("mr_iid", type=int)
@click.argument("message")
@click.option("--file", "file_path", required=True, help="File path in the diff")
@click.option("--line", "line_num", type=int, help="Line number (new file)")
@click.option("--old-line", type=int, help="Line number in old file (for deletions)")
@click.pass_context
def mr_line_comment(ctx, mr_iid: int, message: str, file_path: str, line_num: int, old_line: int | None):
    """Add comment on specific diff line."""
    if (line_num is None) == (old_line is None):
        output_error("Specify exactly one of --line or --old-line")

    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    diff_refs = get_mr_diff_refs(mr)

    position = {
        "base_sha": diff_refs["base_sha"],
        "start_sha": diff_refs["start_sha"],
        "head_sha": diff_refs["head_sha"],
        "position_type": "text",
        "old_path": file_path,
        "new_path": file_path,
    }

    if old_line is not None:
        position["old_line"] = old_line
    else:
        position["new_line"] = line_num

    try:
        discussion = mr.discussions.create(
            {
                "body": message,
                "position": position,
            }
        )

        output_success(
            {
                "discussion_id": discussion.id,
                "message": "Line comment added",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to add line comment: {e}")


@mr_group.command("suggestion")
@click.argument("mr_iid", type=int)
@click.argument("suggested_code")
@click.option("--file", "file_path", required=True, help="File path in the diff")
@click.option("--line", "line_num", required=True, type=int, help="Line number to replace")
@click.option("--lines-above", default=0, type=int, help="Additional lines above to include")
@click.option("--lines-below", default=0, type=int, help="Additional lines below to include")
@click.option("--comment", help="Optional comment before suggestion")
@click.pass_context
def mr_suggestion(
    ctx,
    mr_iid: int,
    suggested_code: str,
    file_path: str,
    line_num: int,
    lines_above: int,
    lines_below: int,
    comment: str | None,
):
    """Add code suggestion on diff line."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    diff_refs = get_mr_diff_refs(mr)

    suggestion_body = f"```suggestion:-{lines_above}+{lines_below}\n{suggested_code}\n```"
    if comment:
        suggestion_body = f"{comment}\n\n{suggestion_body}"

    position = {
        "base_sha": diff_refs["base_sha"],
        "start_sha": diff_refs["start_sha"],
        "head_sha": diff_refs["head_sha"],
        "position_type": "text",
        "old_path": file_path,
        "new_path": file_path,
        "new_line": line_num,
    }

    try:
        discussion = mr.discussions.create(
            {
                "body": suggestion_body,
                "position": position,
            }
        )

        output_success(
            {
                "discussion_id": discussion.id,
                "message": "Suggestion added",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to add suggestion: {e}")


# =============================================================================
# MR Draft Commands
# =============================================================================


@mr_group.group("draft")
def mr_draft_group():
    """Draft review comments."""
    pass


@mr_draft_group.command("add")
@click.argument("mr_iid", type=int)
@click.argument("message", required=False)
@click.option("--file", "file_path", help="File path for line comment")
@click.option("--line", "line_num", type=int, help="Line number for line comment")
@click.option(
    "--suggestion",
    "suggested_code",
    help="Code suggestion (replaces --message as suggestion)",
)
@click.pass_context
def draft_add(
    ctx,
    mr_iid: int,
    message: str | None,
    file_path: str | None,
    line_num: int | None,
    suggested_code: str | None,
):
    """Add draft comment (not visible until published)."""
    if not message and not suggested_code:
        output_error("Provide MESSAGE or --suggestion")
    if (file_path is None) != (line_num is None):
        output_error("Use --file and --line together for line-specific draft comments")

    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    draft_data: dict[str, Any] = {}

    if suggested_code:
        draft_data["note"] = f"```suggestion:-0+0\n{suggested_code}\n```"
        if message and message != suggested_code:
            draft_data["note"] = f"{message}\n\n{draft_data['note']}"
    else:
        draft_data["note"] = message

    if file_path and line_num:
        diff_refs = get_mr_diff_refs(mr)
        draft_data["position"] = {
            "base_sha": diff_refs["base_sha"],
            "start_sha": diff_refs["start_sha"],
            "head_sha": diff_refs["head_sha"],
            "position_type": "text",
            "old_path": file_path,
            "new_path": file_path,
            "new_line": line_num,
        }

    try:
        draft = mr.draft_notes.create(draft_data)
        output_success(
            {
                "draft_id": draft.id,
                "message": "Draft comment added",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to add draft comment: {e}")


@mr_draft_group.command("list")
@click.argument("mr_iid", type=int)
@click.pass_context
def draft_list(ctx, mr_iid: int):
    """List draft comments."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        drafts = mr.draft_notes.list(get_all=True)
        result = []

        for draft in drafts:
            result.append(
                {
                    "id": draft.id,
                    "note": draft.note,
                    "position": getattr(draft, "position", None),
                    "author": draft.author.get("username") if hasattr(draft, "author") and draft.author else None,
                }
            )

        output_success(result)
    except GitlabError as e:
        output_error(f"Failed to list draft comments: {e}")


@mr_draft_group.command("publish")
@click.argument("mr_iid", type=int)
@click.pass_context
def draft_publish(ctx, mr_iid: int):
    """Publish all draft comments."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        drafts = mr.draft_notes.list(get_all=True)
        count = len(drafts)

        if count == 0:
            output_success({"message": "No drafts to publish", "count": 0})
            return

        mr.draft_notes.bulk_publish()
        output_success(
            {
                "message": f"Published {count} draft comment(s)",
                "count": count,
            }
        )
    except GitlabError as e:
        output_error(f"Failed to publish draft comments: {e}")


@mr_draft_group.command("delete")
@click.argument("mr_iid", type=int)
@click.argument("draft_id", type=int)
@click.pass_context
def draft_delete(ctx, mr_iid: int, draft_id: int):
    """Delete a draft comment."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        draft = mr.draft_notes.get(draft_id)
        draft.delete()
        output_success({"message": f"Draft {draft_id} deleted"})
    except GitlabError as e:
        output_error(f"Failed to delete draft: {e}")


# =============================================================================
# MR Actions
# =============================================================================


@mr_group.command("approve")
@click.argument("mr_iid", type=int)
@click.pass_context
def mr_approve(ctx, mr_iid: int):
    """Approve merge request."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        mr.approve()
        output_success({"message": f"MR !{mr_iid} approved"})
    except GitlabError as e:
        output_error(f"Failed to approve: {e}")


@mr_group.command("unapprove")
@click.argument("mr_iid", type=int)
@click.pass_context
def mr_unapprove(ctx, mr_iid: int):
    """Remove approval from merge request."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        mr.unapprove()
        output_success({"message": f"MR !{mr_iid} approval removed"})
    except GitlabError as e:
        output_error(f"Failed to unapprove: {e}")


@mr_group.command("resolve")
@click.argument("mr_iid", type=int)
@click.argument("discussion_id")
@click.option("--unresolve", is_flag=True, help="Unresolve instead of resolve")
@click.pass_context
def mr_resolve(ctx, mr_iid: int, discussion_id: str, unresolve: bool):
    """Resolve or unresolve a discussion thread."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        discussion = mr.discussions.get(discussion_id)
        discussion.resolved = not unresolve
        discussion.save()

        action = "unresolved" if unresolve else "resolved"
        output_success({"message": f"Discussion {discussion_id} {action}"})
    except GitlabError as e:
        output_error(f"Failed to resolve discussion: {e}")


@mr_group.command("delete-comment")
@click.argument("mr_iid", type=int)
@click.argument("note_id", type=int)
@click.pass_context
def mr_delete_comment(ctx, mr_iid: int, note_id: int):
    """Delete a comment/note from MR."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        note = mr.notes.get(note_id)
        note.delete()
        output_success({"message": f"Comment {note_id} deleted"})
    except GitlabError as e:
        output_error(f"Failed to delete comment: {e}")


@mr_group.command("reply")
@click.argument("mr_iid", type=int)
@click.argument("discussion_id")
@click.argument("message")
@click.pass_context
def mr_reply(ctx, mr_iid: int, discussion_id: str, message: str):
    """Reply to an existing discussion thread."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        discussion = mr.discussions.get(discussion_id)
        note = discussion.notes.create({"body": message})
        output_success(
            {
                "note_id": note.id,
                "discussion_id": discussion_id,
                "message": "Reply added",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to reply: {e}")


@mr_group.command("merge")
@click.argument("mr_iid", type=int)
@click.option("--squash", is_flag=True, help="Squash commits")
@click.option("--delete-branch", is_flag=True, help="Delete source branch after merge")
@click.option("--message", "-m", help="Custom merge commit message")
@click.pass_context
def mr_merge(ctx, mr_iid: int, squash: bool, delete_branch: bool, message: str | None):
    """Merge the merge request."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    merge_params: dict[str, Any] = {}
    if squash:
        merge_params["squash"] = True
    if delete_branch:
        merge_params["should_remove_source_branch"] = True
    if message:
        merge_params["merge_commit_message"] = message

    try:
        mr.merge(**merge_params)
        output_success({"message": f"MR !{mr_iid} merged"})
    except GitlabError as e:
        output_error(f"Failed to merge: {e}")


@mr_group.command("commits")
@click.argument("mr_iid", type=int)
@click.pass_context
def mr_commits(ctx, mr_iid: int):
    """List commits in merge request."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    try:
        commits = mr.commits()
        result = []

        for commit in commits:
            result.append(
                {
                    "sha": commit.id[:8],
                    "full_sha": commit.id,
                    "title": commit.title,
                    "author": commit.author_name,
                    "created_at": commit.created_at,
                }
            )

        output_success(result)
    except GitlabError as e:
        output_error(f"Failed to get MR commits: {e}")


@mr_group.command("assign")
@click.argument("mr_iid", type=int)
@click.option("--assignee", "-a", multiple=True, help="Assignee username (use multiple times)")
@click.option("--reviewer", "-r", multiple=True, help="Reviewer username (use multiple times)")
@click.option("--clear-assignees", is_flag=True, help="Remove all assignees")
@click.option("--clear-reviewers", is_flag=True, help="Remove all reviewers")
@click.pass_context
def mr_assign(
    ctx,
    mr_iid: int,
    assignee: tuple[str, ...],
    reviewer: tuple[str, ...],
    clear_assignees: bool,
    clear_reviewers: bool,
):
    """Assign or change assignees/reviewers on MR."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    update_data: dict[str, Any] = {}

    if clear_assignees:
        update_data["assignee_ids"] = []
    elif assignee:
        update_data["assignee_ids"] = [resolve_user_id(gl, username) for username in assignee]

    if clear_reviewers:
        update_data["reviewer_ids"] = []
    elif reviewer:
        update_data["reviewer_ids"] = [resolve_user_id(gl, username) for username in reviewer]

    if not update_data:
        output_error("No changes specified. Use --assignee, --reviewer, --clear-assignees, or --clear-reviewers")

    try:
        for field, value in update_data.items():
            setattr(mr, field, value)
        mr.save()
        mr = get_mr(project, mr_iid)
        output_success(
            {
                "message": f"MR !{mr_iid} updated",
                "assignees": [a.get("username") for a in mr.assignees] if mr.assignees else [],
                "reviewers": [r.get("username") for r in mr.reviewers] if mr.reviewers else [],
            }
        )
    except GitlabError as e:
        output_error(f"Failed to update MR: {e}")


@mr_group.command("create")
@click.argument("title")
@click.option("--source", "-s", help="Source branch (default: current branch)")
@click.option("--target", "-t", default="main", help="Target branch (default: main)")
@click.option("--description", "-d", help="MR description")
@click.option("--draft", is_flag=True, help="Create as draft MR")
@click.option("--assignee", "-a", help="Assignee username or 'me'")
@click.option("--reviewer", "-r", multiple=True, help="Reviewer username (use multiple times)")
@click.option("--labels", "-l", help="Comma-separated labels")
@click.pass_context
def mr_create(
    ctx,
    title: str,
    source: str | None,
    target: str,
    description: str | None,
    draft: bool,
    assignee: str | None,
    reviewer: tuple[str, ...],
    labels: str | None,
):
    """Create a new merge request."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    user = get_current_user(gl)

    # Detect source branch from git if not specified
    if not source:
        try:
            result = subprocess.run(
                ["git", "branch", "--show-current"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            source = result.stdout.strip()
        except Exception:
            output_error("Could not detect current branch. Use --source to specify.")

    if not source:
        output_error("Source branch is required")

    mr_data: dict[str, Any] = {
        "source_branch": source,
        "target_branch": target,
        "title": f"Draft: {title}" if draft else title,
    }

    if description:
        mr_data["description"] = description

    if assignee == "me":
        mr_data["assignee_id"] = user.id
    elif assignee:
        users = gl.users.list(username=assignee)
        if users:
            mr_data["assignee_id"] = users[0].id

    if reviewer:
        reviewer_ids = []
        for username in reviewer:
            users = gl.users.list(username=username)
            if users:
                reviewer_ids.append(users[0].id)
        if reviewer_ids:
            mr_data["reviewer_ids"] = reviewer_ids

    if labels:
        mr_data["labels"] = labels

    try:
        mr = project.mergerequests.create(mr_data)
        output_success(
            {
                "iid": mr.iid,
                "title": mr.title,
                "web_url": mr.web_url,
                "source_branch": mr.source_branch,
                "target_branch": mr.target_branch,
                "message": f"MR !{mr.iid} created",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to create MR: {e}")


@mr_group.command("update")
@click.argument("mr_iid", type=int)
@click.option("--title", help="New MR title")
@click.option("--description", "-d", help="New MR description")
@click.option("--description-file", help="Read description from file path or '-' for stdin")
@click.option("--target", "-t", "target_branch", help="New target branch")
@click.option("--draft", is_flag=True, help="Mark MR as draft")
@click.option("--ready", is_flag=True, help="Mark MR as ready")
@click.pass_context
def mr_update(
    ctx,
    mr_iid: int,
    title: str | None,
    description: str | None,
    description_file: str | None,
    target_branch: str | None,
    draft: bool,
    ready: bool,
):
    """Update merge request metadata."""
    if description is not None and description_file is not None:
        output_error("--description and --description-file are mutually exclusive")

    if draft and ready:
        output_error("--draft and --ready are mutually exclusive")

    if not any(
        [
            title is not None,
            description is not None,
            description_file is not None,
            target_branch is not None,
            draft,
            ready,
        ]
    ):
        output_error(
            "No changes specified. Use --title, --description, --description-file, --target, --draft, or --ready"
        )

    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    description_value = description
    if description_file is not None:
        if description_file == "-":
            description_value = sys.stdin.read()
        else:
            try:
                with open(description_file, encoding="utf-8") as f:
                    description_value = f.read()
            except OSError as e:
                output_error(f"Failed to read description file: {e}")

    update_data: dict[str, Any] = {}

    if description_value is not None:
        update_data["description"] = description_value

    if target_branch is not None:
        update_data["target_branch"] = target_branch

    title_value = title
    if draft or ready:
        base_title = title_value if title_value is not None else mr.title
        title_value = apply_draft_title_state(base_title, draft=draft, ready=ready)

    if title_value is not None:
        update_data["title"] = title_value

    try:
        for field, value in update_data.items():
            setattr(mr, field, value)
        mr.save()
        mr = get_mr(project, mr_iid)
        output_success(
            {
                "message": f"MR !{mr_iid} updated",
                "iid": mr.iid,
                "title": mr.title,
                "target_branch": mr.target_branch,
                "web_url": mr.web_url,
            }
        )
    except GitlabError as e:
        output_error(f"Failed to update MR: {e}")


@mr_group.command("upload-asset")
@click.argument("mr_iid", type=int)
@click.argument("files", nargs=-1, type=click.Path(path_type=str))
@click.option(
    "--append-to-description",
    is_flag=True,
    default=False,
    help="Append uploaded asset markdown links to MR description",
)
@click.pass_context
def mr_upload_asset(
    ctx,
    mr_iid: int,
    files: tuple[str, ...],
    append_to_description: bool,
):
    """Upload files/assets for merge request usage."""
    if not files:
        output_error("At least one file path must be provided")

    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    mr = get_mr(project, mr_iid)

    assets: list[dict[str, str]] = []
    for file_path in files:
        if not os.path.exists(file_path):
            output_error(f"File not found: {file_path}")
        if not os.path.isfile(file_path):
            output_error(f"Path is not a file: {file_path}")

        upload_data: Any | None = None
        try:
            upload_data = project.upload(
                filename=os.path.basename(file_path),
                filepath=file_path,
            )
        except TypeError:
            try:
                upload_data = project.upload(file_path)
            except TypeError as e:
                output_error(f"Failed to upload file '{file_path}': {e}")
            except GitlabError as e:
                output_error(f"Failed to upload file '{file_path}': {e}")
        except GitlabError as e:
            output_error(f"Failed to upload file '{file_path}': {e}")

        if not isinstance(upload_data, dict):
            output_error(f"Unexpected upload response for '{file_path}'")

        url_value = upload_data.get("url")
        markdown_value = upload_data.get("markdown")

        if not isinstance(url_value, str) or not isinstance(markdown_value, str):
            output_error(f"Upload response missing url/markdown for '{file_path}'")

        url = url_value
        markdown = markdown_value
        if not url or not markdown:
            output_error(f"Upload response missing url/markdown for '{file_path}'")

        if url.startswith("http://") or url.startswith("https://"):
            full_url = url
        else:
            base_url = str(gl.url).rstrip("/")
            if url.startswith("/"):
                full_url = f"{base_url}{url}"
            else:
                full_url = f"{base_url}/{url}"

        assets.append(
            {
                "file": file_path,
                "url": url,
                "full_url": full_url,
                "markdown": markdown,
            }
        )

    if append_to_description:
        markdown_lines = "\n".join(asset["markdown"] for asset in assets)
        existing_description = mr.description or ""
        mr.description = f"{existing_description}\n\n## Uploaded Assets\n{markdown_lines}"
        try:
            mr.save()
        except GitlabError as e:
            output_error(f"Failed to update MR description: {e}")

    output_success(
        {
            "message": f"Uploaded {len(assets)} asset(s) for MR !{mr_iid}",
            "iid": mr.iid,
            "web_url": mr.web_url,
            "assets": assets,
            "appended_to_description": append_to_description,
        }
    )


# =============================================================================
# Issue Commands
# =============================================================================


@cli.group("issue")
def issue_group():
    """Issue commands."""
    pass


@issue_group.command("list")
@click.option("--state", type=click.Choice(["opened", "closed", "all"]), default="opened")
@click.option("--assignee", help="Filter by assignee username or 'me'")
@click.option("--author", help="Filter by author username or 'me'")
@click.option("--labels", help="Comma-separated labels")
@click.option("--limit", default=20, help="Max results")
@click.pass_context
def issue_list(
    ctx,
    state: str,
    assignee: str | None,
    author: str | None,
    labels: str | None,
    limit: int,
):
    """List issues."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    user = get_current_user(gl)

    kwargs: dict[str, Any] = {"state": state, "per_page": limit}

    if assignee == "me":
        kwargs["assignee_id"] = user.id
    elif assignee:
        kwargs["assignee_username"] = assignee

    if author == "me":
        kwargs["author_id"] = user.id
    elif author:
        kwargs["author_username"] = author

    if labels:
        kwargs["labels"] = labels.split(",")

    issues = project.issues.list(**kwargs)
    result = []

    for issue in issues:
        result.append(
            {
                "iid": issue.iid,
                "title": issue.title,
                "state": issue.state,
                "author": issue.author.get("username") if issue.author else None,
                "assignees": [a.get("username") for a in (issue.assignees or [])],
                "labels": issue.labels,
                "web_url": issue.web_url,
                "created_at": issue.created_at,
                "updated_at": issue.updated_at,
            }
        )

    output_success(result)


@issue_group.command("info")
@click.argument("issue_iid", type=int)
@click.pass_context
def issue_info(ctx, issue_iid: int):
    """Get issue details."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        issue = project.issues.get(issue_iid)
    except GitlabError as e:
        output_error(f"Issue #{issue_iid} not found: {e}")
        return  # unreachable but satisfies type checker

    output_success(
        {
            "iid": issue.iid,
            "title": issue.title,
            "description": issue.description,
            "state": issue.state,
            "author": issue.author.get("username") if issue.author else None,
            "assignees": [a.get("username") for a in (issue.assignees or [])],
            "labels": issue.labels,
            "milestone": issue.milestone.get("title") if issue.milestone else None,
            "due_date": issue.due_date,
            "web_url": issue.web_url,
            "created_at": issue.created_at,
            "updated_at": issue.updated_at,
            "closed_at": issue.closed_at,
        }
    )


@issue_group.command("create")
@click.argument("title")
@click.option("--description", "-d", help="Issue description")
@click.option("--labels", "-l", help="Comma-separated labels")
@click.option("--assignee", "-a", help="Assignee username or 'me'")
@click.option("--milestone", "-m", help="Milestone title")
@click.pass_context
def issue_create(
    ctx,
    title: str,
    description: str | None,
    labels: str | None,
    assignee: str | None,
    milestone: str | None,
):
    """Create new issue."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    user = get_current_user(gl)

    issue_data: dict[str, Any] = {"title": title}

    if description:
        issue_data["description"] = description

    if labels:
        issue_data["labels"] = parse_csv_items(labels)

    if assignee:
        issue_data["assignee_ids"] = [resolve_user_id(gl, assignee, current_user=user)]

    if milestone:
        issue_data["milestone_id"] = resolve_milestone_id(project, milestone)

    issue = project.issues.create(issue_data)
    output_success(
        {
            "iid": issue.iid,
            "title": issue.title,
            "web_url": issue.web_url,
            "message": f"Issue #{issue.iid} created",
        }
    )


@issue_group.command("update")
@click.argument("issue_iid", type=int)
@click.option("--title", help="New issue title")
@click.option("--description", "-d", help="New issue description")
@click.option("--labels", "-l", help="Replace labels with comma-separated list")
@click.option("--add-label", multiple=True, help="Add a label (use multiple times)")
@click.option("--remove-label", multiple=True, help="Remove a label (use multiple times)")
@click.option("--assignee", "-a", help="Assignee username or 'me'")
@click.option("--clear-assignees", is_flag=True, help="Remove all assignees")
@click.option("--milestone", "-m", help="Milestone title")
@click.pass_context
def issue_update(
    ctx,
    issue_iid: int,
    title: str | None,
    description: str | None,
    labels: str | None,
    add_label: tuple[str, ...],
    remove_label: tuple[str, ...],
    assignee: str | None,
    clear_assignees: bool,
    milestone: str | None,
):
    """Update issue metadata."""
    if assignee and clear_assignees:
        output_error("--assignee and --clear-assignees are mutually exclusive")

    if not any(
        [
            title is not None,
            description is not None,
            labels is not None,
            add_label,
            remove_label,
            assignee is not None,
            clear_assignees,
            milestone is not None,
        ]
    ):
        output_error(
            "No changes specified. Use --title, --description, --labels, --add-label, --remove-label, --assignee, --clear-assignees, or --milestone"
        )

    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    user = get_current_user(gl)

    try:
        issue = project.issues.get(issue_iid)
    except GitlabError as e:
        output_error(f"Issue #{issue_iid} not found: {e}")
        return

    update_data: dict[str, Any] = {}

    if title is not None:
        update_data["title"] = title

    if description is not None:
        update_data["description"] = description

    if labels is not None or add_label or remove_label:
        current_labels = list(issue.labels or [])
        next_labels = parse_csv_items(labels) if labels is not None else current_labels

        for label in add_label:
            if label not in next_labels:
                next_labels.append(label)

        remove_set = {label for label in remove_label}
        if remove_set:
            next_labels = [label for label in next_labels if label not in remove_set]

        update_data["labels"] = next_labels

    if clear_assignees:
        update_data["assignee_ids"] = []
    elif assignee is not None:
        update_data["assignee_ids"] = [resolve_user_id(gl, assignee, current_user=user)]

    if milestone is not None:
        update_data["milestone_id"] = resolve_milestone_id(project, milestone)

    try:
        for field, value in update_data.items():
            setattr(issue, field, value)
        issue.save()
        issue = project.issues.get(issue_iid)
        output_success(
            {
                "message": f"Issue #{issue_iid} updated",
                "iid": issue.iid,
                "title": issue.title,
                "labels": issue.labels,
                "assignees": [a.get("username") for a in (issue.assignees or [])],
                "milestone": issue.milestone.get("title") if issue.milestone else None,
                "web_url": issue.web_url,
            }
        )
    except GitlabError as e:
        output_error(f"Failed to update issue: {e}")


@issue_group.command("close")
@click.argument("issue_iid", type=int)
@click.pass_context
def issue_close(ctx, issue_iid: int):
    """Close an issue."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        issue = project.issues.get(issue_iid)
        issue.state_event = "close"
        issue.save()
        output_success({"message": f"Issue #{issue_iid} closed"})
    except GitlabError as e:
        output_error(f"Failed to close issue: {e}")


@issue_group.command("reopen")
@click.argument("issue_iid", type=int)
@click.pass_context
def issue_reopen(ctx, issue_iid: int):
    """Reopen a closed issue."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        issue = project.issues.get(issue_iid)
        issue.state_event = "reopen"
        issue.save()
        output_success({"message": f"Issue #{issue_iid} reopened"})
    except GitlabError as e:
        output_error(f"Failed to reopen issue: {e}")


@issue_group.command("comment")
@click.argument("issue_iid", type=int)
@click.argument("message")
@click.pass_context
def issue_comment(ctx, issue_iid: int, message: str):
    """Add comment to an issue."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        issue = project.issues.get(issue_iid)
        note = issue.notes.create({"body": message})
        output_success(
            {
                "note_id": note.id,
                "message": "Comment added",
            }
        )
    except GitlabError as e:
        output_error(f"Failed to add comment: {e}")


# =============================================================================
# Pipeline Commands
# =============================================================================


@cli.group("pipeline")
def pipeline_group():
    """Pipeline and CI/CD commands."""
    pass


@pipeline_group.command("list")
@click.option("--ref", help="Filter by branch/tag")
@click.option(
    "--status",
    type=click.Choice(["running", "pending", "success", "failed", "canceled", "skipped"]),
)
@click.option("--mine", is_flag=True, help="Only my pipelines")
@click.option("--limit", default=10, help="Max results")
@click.pass_context
def pipeline_list(ctx, ref: str | None, status: str | None, mine: bool, limit: int):
    """List pipelines."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])
    user = get_current_user(gl)

    kwargs: dict[str, Any] = {
        "per_page": limit,
        "order_by": "updated_at",
        "sort": "desc",
    }

    if ref:
        kwargs["ref"] = ref
    if status:
        kwargs["status"] = status
    if mine:
        kwargs["username"] = user.username

    pipelines = project.pipelines.list(**kwargs)
    result = []

    for p in pipelines:
        result.append(
            {
                "id": p.id,
                "status": p.status,
                "ref": p.ref,
                "sha": p.sha[:8],
                "web_url": p.web_url,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
        )

    output_success(result)


@pipeline_group.command("status")
@click.argument("pipeline_id", type=int)
@click.pass_context
def pipeline_status(ctx, pipeline_id: int):
    """Get pipeline status and jobs."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        pipeline = project.pipelines.get(pipeline_id)
    except GitlabError as e:
        output_error(f"Pipeline {pipeline_id} not found: {e}")
        return  # unreachable but satisfies type checker

    jobs = pipeline.jobs.list(get_all=True)
    job_list = []

    for job in jobs:
        job_list.append(
            {
                "id": job.id,
                "name": job.name,
                "stage": job.stage,
                "status": job.status,
                "duration": job.duration,
                "web_url": job.web_url,
            }
        )

    output_success(
        {
            "id": pipeline.id,
            "status": pipeline.status,
            "ref": pipeline.ref,
            "sha": pipeline.sha,
            "duration": pipeline.duration,
            "web_url": pipeline.web_url,
            "jobs": job_list,
        }
    )


@pipeline_group.command("retry")
@click.argument("pipeline_id", type=int)
@click.pass_context
def pipeline_retry(ctx, pipeline_id: int):
    """Retry failed pipeline."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        pipeline = project.pipelines.get(pipeline_id)
        pipeline.retry()
        output_success({"message": f"Pipeline {pipeline_id} retry triggered"})
    except GitlabError as e:
        output_error(f"Failed to retry pipeline: {e}")


@pipeline_group.command("cancel")
@click.argument("pipeline_id", type=int)
@click.pass_context
def pipeline_cancel(ctx, pipeline_id: int):
    """Cancel running pipeline."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        pipeline = project.pipelines.get(pipeline_id)
        pipeline.cancel()
        output_success({"message": f"Pipeline {pipeline_id} canceled"})
    except GitlabError as e:
        output_error(f"Failed to cancel pipeline: {e}")


# =============================================================================
# Job Commands
# =============================================================================


@cli.group("job")
def job_group():
    """Job commands."""
    pass


@job_group.command("log")
@click.argument("job_id", type=int)
@click.option("--tail", type=int, help="Only show last N lines")
@click.pass_context
def job_log(ctx, job_id: int, tail: int | None):
    """Get job log/trace."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        job = project.jobs.get(job_id)
        trace = job.trace().decode("utf-8")

        if tail:
            lines = trace.split("\n")
            trace = "\n".join(lines[-tail:])

        output_success(
            {
                "job_id": job_id,
                "name": job.name,
                "status": job.status,
                "log": trace,
            }
        )
    except GitlabError as e:
        output_error(f"Failed to get job log: {e}")


@job_group.command("retry")
@click.argument("job_id", type=int)
@click.pass_context
def job_retry(ctx, job_id: int):
    """Retry a job."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        job = project.jobs.get(job_id)
        job.retry()
        output_success({"message": f"Job {job_id} retry triggered"})
    except GitlabError as e:
        output_error(f"Failed to retry job: {e}")


@job_group.command("cancel")
@click.argument("job_id", type=int)
@click.pass_context
def job_cancel(ctx, job_id: int):
    """Cancel a running job."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        job = project.jobs.get(job_id)
        job.cancel()
        output_success({"message": f"Job {job_id} canceled"})
    except GitlabError as e:
        output_error(f"Failed to cancel job: {e}")


@job_group.command("play")
@click.argument("job_id", type=int)
@click.pass_context
def job_play(ctx, job_id: int):
    """Trigger a manual job."""
    gl = get_client()
    project = get_project(gl, ctx.obj["project_path"])

    try:
        job = project.jobs.get(job_id)
        job.play()
        output_success({"message": f"Job {job_id} triggered"})
    except GitlabError as e:
        output_error(f"Failed to trigger job: {e}")


# =============================================================================
# Actionable Items
# =============================================================================


@cli.command("actionable")
@click.option(
    "--all-projects",
    is_flag=True,
    help="Scan all accessible projects, not just current",
)
@click.pass_context
def actionable(ctx, all_projects: bool):
    """Scan for actionable items requiring attention."""
    gl = get_client()
    user = get_current_user(gl)
    project = None if all_projects else get_project(gl, ctx.obj["project_path"])

    result = {
        "mrs_to_review": [],
        "mrs_with_unresolved_discussions": [],
        "failed_pipelines": [],
    }

    try:
        if all_projects:
            # Get MRs where I'm a reviewer
            mrs_to_review = gl.mergerequests.list(
                state="opened",
                reviewer_id=user.id,
                scope="all",
                get_all=True,
            )
        else:
            current_project = project
            if current_project is None:
                output_error("Project context is required when not using --all-projects")
            mrs_to_review = current_project.mergerequests.list(
                state="opened",
                reviewer_id=user.id,
                get_all=True,
            )

        for mr in mrs_to_review:
            result["mrs_to_review"].append(
                {
                    "iid": mr.iid,
                    "title": mr.title,
                    "author": mr.author.get("username") if mr.author else None,
                    "web_url": mr.web_url,
                    "project": mr.references.get("full") if hasattr(mr, "references") else None,
                }
            )

        # Get my MRs with issues
        if all_projects:
            my_mrs = gl.mergerequests.list(
                state="opened",
                author_id=user.id,
                scope="all",
                get_all=True,
            )
        else:
            current_project = project
            if current_project is None:
                output_error("Project context is required when not using --all-projects")
            my_mrs = current_project.mergerequests.list(
                state="opened",
                author_id=user.id,
                get_all=True,
            )

        for mr in my_mrs:
            # Check for unresolved discussions
            if hasattr(mr, "blocking_discussions_resolved") and not mr.blocking_discussions_resolved:
                result["mrs_with_unresolved_discussions"].append(
                    {
                        "iid": mr.iid,
                        "title": mr.title,
                        "web_url": mr.web_url,
                    }
                )

            # Check pipeline status
            if mr.head_pipeline and mr.head_pipeline.get("status") == "failed":
                result["failed_pipelines"].append(
                    {
                        "iid": mr.iid,
                        "title": mr.title,
                        "pipeline_id": mr.head_pipeline.get("id"),
                        "web_url": mr.web_url,
                    }
                )

        output_success(result)
    except GitlabError as e:
        output_error(f"Failed to scan actionable items: {e}")


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    cli()
