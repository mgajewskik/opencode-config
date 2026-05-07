type Denial = {
  reason: string
  pattern: string
}

const TOKEN = String.raw`(^|[^A-Za-z0-9_.-])`
const END = String.raw`($|[^A-Za-z0-9_.-])`
const ARG = String.raw`(?:[^;&|]*\s+)`

function rx(pattern: string, reason: string): DenialPattern {
  return { regex: new RegExp(pattern, "i"), reason }
}

type DenialPattern = {
  regex: RegExp
  reason: string
}

const BASH_DENY_PATTERNS: DenialPattern[] = [
  rx(String.raw`${TOKEN}(sudoedit|sudo|doas|pkexec|su|runuser)${END}`, "privilege escalation or identity switch"),
  rx(String.raw`${TOKEN}(shutdown|reboot|halt|poweroff|dd|mkfs|fdisk|parted|shred|wipe|scrub|badblocks|grub|efibootmgr|kexec|kdump|dracut|mkinitcpio|update-initramfs|insmod|rmmod|modprobe|sysctl|passwd|useradd|userdel|usermod|groupadd|groupdel|adduser|deluser)${END}`, "destructive host command"),
  rx(String.raw`${TOKEN}(grub-install|grub2-install)${END}`, "bootloader install"),
  rx(String.raw`${TOKEN}bootctl\s+(install|update|remove)${END}`, "systemd-boot mutation"),
  rx(String.raw`${TOKEN}(init|telinit)\s+(0|6)${END}`, "host power-state transition"),
  rx(String.raw`${TOKEN}systemctl[^;&|]*(reboot|poweroff|halt|kexec|rescue|emergency|mask|disable)${END}`, "dangerous systemctl operation"),
  rx(String.raw`${TOKEN}systemctl\s+--user\s+(enable|start|link|daemon-reload|reload|restart)${END}`, "user persistence via systemd"),
  rx(String.raw`${TOKEN}loginctl[^;&|]*(reboot|poweroff|halt|terminate-session|kill-session|terminate-user|kill-user|lock-session|unlock-session|lock-sessions|unlock-sessions)${END}`, "dangerous loginctl operation"),
  rx(String.raw`${TOKEN}setenforce\s+0${END}`, "SELinux weakening"),
  rx(String.raw`${TOKEN}chcon\s+-R${END}`, "recursive SELinux context relabel"),
  rx(String.raw`${TOKEN}sed\s+[^;&|]*SELINUX\s*=\s*disabled`, "SELinux disable via sed"),
  rx(String.raw`${TOKEN}(aa-disable|aa-complain|aa-teardown)${END}`, "AppArmor profile weakening"),

  rx(String.raw`${TOKEN}(pacman|yay|paru|trizen|pikaur|aurman|pakku|makepkg|apt|apt-get|dpkg|yum|dnf|rpm|snap|flatpak|brew|rtx|asdf|easy_install|npx|bunx|corepack)${END}`, "package manager or installer surface"),
  rx(String.raw`${TOKEN}(pip|npm|cargo|gem|pnpm|yarn|bun|poetry|pipenv|pipx|bundle|composer)\s+(install|uninstall|add|remove|ci|require)${END}`, "dependency install or removal"),
  rx(String.raw`${TOKEN}(uv\s+(add|pip\s+install|tool\s+install)|go\s+(install|get)|mise\s+install|(conda|mamba|micromamba)\s+install|(python|python3)\s+-m\s+pip\s+(install|uninstall)|dotnet\s+add\s+package|nuget\s+install|nix\s+(profile\s+install|develop|run)|nix-env|nix-shell)${END}`, "dependency install or toolchain mutation"),
  rx(String.raw`${TOKEN}deno\s+run[^;&|]*--allow-all${END}`, "unrestricted deno execution"),

  // rx(String.raw`${TOKEN}(env|printenv|export|set|declare|compgen|history|fc)${END}`, "environment or shell introspection"),
  rx(String.raw`${TOKEN}(echo|printf)\s+(\$|\$\{|%?env)`, "environment dump via shell builtin"),
  rx(String.raw`${TOKEN}unset\s+(HISTFILE|HISTSIZE|HISTFILESIZE|PROMPT_COMMAND)${END}`, "history disable"),
  rx(String.raw`${TOKEN}HISTFILE\s*=\s*/dev/null`, "history redirect to /dev/null"),

  rx(String.raw`${TOKEN}git\s+reset${ARG}--hard${END}`, "destructive git reset"),
  rx(String.raw`${TOKEN}git\b[^;&|]*\s+reset\b[^;&|]*--hard${END}`, "destructive git reset"),
  rx(String.raw`${TOKEN}git\s+clean${ARG}-[^\s;&|]*f[^\s;&|]*d[^\s;&|]*${END}`, "destructive git clean"),
  rx(String.raw`${TOKEN}git\s+clean${ARG}-[^\s;&|]*f[^;&|]*\s+-[^\s;&|]*d[^\s;&|]*${END}`, "destructive git clean"),
  rx(String.raw`${TOKEN}git\b[^;&|]*\s+clean\b[^;&|]*-[^\s;&|]*f[^\s;&|]*d[^\s;&|]*${END}`, "destructive git clean"),
  rx(String.raw`${TOKEN}git\s+push[^;&|]*(--force|--force-with-lease|-f|--mirror|--delete|-d|\s:[^\s;&|]+|\+refs/)${END}`, "destructive git push"),
  rx(String.raw`${TOKEN}git\b[^;&|]*\s+push\b[^;&|]*(--force|--force-with-lease|-f|--mirror|--delete|-d|\s:[^\s;&|]+|\+refs/)${END}`, "destructive git push"),

  rx(String.raw`${TOKEN}(docker|podman|nerdctl)\s+system\s+prune[^;&|]*(-a|--all)${END}`, "destructive container cleanup"),
  rx(String.raw`${TOKEN}(docker|podman|nerdctl)\s+(rm|rmi)[^;&|]*(-f|--force)${END}`, "destructive container removal"),
  rx(String.raw`${TOKEN}docker${ARG}(inspect)${END}`, "container exec or inspect"),
  rx(String.raw`${TOKEN}docker\s+run[^;&|]*(--privileged|--pid=host|--net=host|-v\s+/(:|\s)|/var/run/docker\.sock)${END}`, "dangerous docker run"),
  rx(String.raw`${TOKEN}(docker-compose\s+config|podman|crictl)${END}`, "container runtime sensitive surface"),

  rx(String.raw`${TOKEN}(kubectl|k)\b[^;&|]*\s+delete\b`, "kubectl delete is blocked"),
  rx(String.raw`${TOKEN}oc\b[^;&|]*\s+delete\b`, "oc delete is blocked"),
  rx(String.raw`${TOKEN}(kubectl|k)\b[^;&|]*\s+(get|describe)\s+secret${END}`, "Kubernetes secret read"),
  rx(String.raw`${TOKEN}(kubectl|k)\b[^;&|]*\s+(drain)${END}`, "dangerous kubectl operation"),
  rx(String.raw`${TOKEN}(kubectl|k|oc)\b[^;&|]*\s+(apply|create|replace)[^;&|]*\s+(-f|--filename)\s+(https?://|-)`, "Kubernetes manifest from URL or stdin"),
  rx(String.raw`${TOKEN}(kubectl|k)\b[^;&|]*\s+(replace[^;&|]*--force|scale[^;&|]*--replicas=0|auth\s+reconcile[^;&|]*-f|taint\s+nodes?[^;&|]*NoSchedule)${END}`, "dangerous kubectl mutation"),
  rx(String.raw`${TOKEN}(kubectl|k)\b[^;&|]*\s+(create\s+(clusterrolebinding|rolebinding)[^;&|]*(cluster-admin|system:masters)|patch\s+(clusterrole|clusterrolebinding|role|rolebinding|validatingwebhookconfiguration|mutatingwebhookconfiguration|apiservice|crd))`, "Kubernetes privilege or control-plane mutation"),
  rx(String.raw`${TOKEN}oc\s+adm\s+(policy\s+add-(cluster-role|scc)-to-user|drain|cordon|uncordon|upgrade)`, "dangerous OpenShift admin operation"),
  rx(String.raw`${TOKEN}oc\s+patch\s+(oauth|authentication|ingress|proxy|apiserver|image|operatorhub|clusteroperator|co)[^;&|]*--type`, "OpenShift control-plane patch"),

  rx(String.raw`${TOKEN}(terraform|tofu|tf)${ARG}(destroy|apply|import|force-unlock)${END}`, "Terraform/OpenTofu state mutation"),
  rx(String.raw`${TOKEN}(terraform|tofu|tf)${ARG}state\s+(rm|mv|push|replace-provider)${END}`, "Terraform/OpenTofu state mutation"),
  rx(String.raw`${TOKEN}(terraform|tofu|tf)${ARG}workspace\s+delete${END}`, "Terraform/OpenTofu workspace deletion"),
  rx(String.raw`${TOKEN}(terraform|tofu|tf)${ARG}(output|show|state)${END}`, "Terraform/OpenTofu sensitive state read"),

  rx(String.raw`${TOKEN}helm\s+(delete|uninstall)${END}`, "Helm release deletion"),
  rx(String.raw`${TOKEN}helm\s+upgrade[^;&|]*--force${END}`, "forceful Helm upgrade"),
  rx(String.raw`${TOKEN}helm\s+(install|upgrade)\s+[^\s;&|]+\s+(oci://|https?://)`, "Helm remote chart install or upgrade"),
  rx(String.raw`${TOKEN}helm\s+upgrade[^;&|]*--install[^;&|]*(oci://|https?://)`, "Helm remote chart install-or-upgrade"),

  rx(String.raw`${TOKEN}ansible-vault${END}`, "Ansible vault access"),
  rx(String.raw`${TOKEN}ansible-playbook[^;&|]*(-i|--inventory)(=|\s+)[^;&|\s]*prod(uction)?[^;&|\s]*`, "Ansible production inventory run"),
  rx(String.raw`${TOKEN}ansible\s+[^;&|]*\s+-m\s+(shell|command|raw)[^;&|]*\s+-a\s+[^;&|]*(rm\s+-rf|mkfs|shutdown|reboot|systemctl\s+(stop|disable|mask))`, "destructive Ansible ad-hoc command"),
  rx(String.raw`${TOKEN}ansible-playbook[^;&|]*(--become|-b)[^;&|]*(-i|--inventory)(=|\s+)[^;&|\s]*(prod|production|all)[^;&|\s]*`, "privileged broad Ansible playbook run"),
  rx(String.raw`${TOKEN}ansible-playbook[^;&|]*(--extra-vars|-e)[^;&|]*(state=absent|delete=true|destroy=true|purge=true)`, "destructive Ansible extra-vars"),

  rx(String.raw`${TOKEN}(aws|gcloud|az|doctl|vercel|netlify|flyctl|railway|supabase|firebase|heroku)${END}`, "broad cloud CLI surface"),
  rx(String.raw`${TOKEN}aws\s+[^;&|]*(delete-[^\s;&|]+|terminate-instances)${END}`, "AWS destructive operation"),
  rx(String.raw`${TOKEN}(gcloud|az|doctl)\s+[^;&|]*\s+delete${END}`, "cloud CLI deletion"),
  rx(String.raw`${TOKEN}aws\s+s3\s+(cp|sync|mv)\s+[^;&|]*(\.aws|\.kube|\.ssh|\.azure|\.config/gcloud|\.codex/auth|/etc/shadow)`, "cloud upload of protected path"),
  rx(String.raw`${TOKEN}gh\s+(repo\s+(delete|create[^;&|]*--public|edit[^;&|]*--visibility\s+public)|secret\s+(set|delete)|release\s+(create|delete|edit))${END}`, "dangerous GitHub CLI operation"),

  rx(String.raw`${TOKEN}(curl|wget)[^|]*\|\s*(sudo\s+)?(sh|bash|zsh|fish|ksh)${END}`, "download piped to shell"),
  rx(String.raw`${TOKEN}(bash|sh)\s+-c[^;&|]*\$\([^)]*(curl|wget)`, "shell executes downloaded content"),
  rx(String.raw`${TOKEN}(source|\.)\s+<\([^)]*(curl|wget)`, "source executes downloaded content"),
  rx(String.raw`${TOKEN}(curl|wget)[^;&|]*(&&|;)\s*chmod\s+[^;&|]*\+x[^;&|]*(&&|;)\s*(\./|/tmp/|/var/tmp/|bash\s|sh\s)`, "download chmod execute chain"),
  rx(String.raw`${TOKEN}(curl|wget)\s+[^;&|]*(--request[=\s]+(DELETE|PUT|PATCH)|-X\s*(DELETE|PUT|PATCH)|--upload-file|-T\s|--data-binary\s*@|--data\s*@|-d\s*@|-F\s*[^;&|]*@)`, "risky curl/wget mutation or upload"),
  rx(String.raw`${TOKEN}wget\s+[^;&|]*--method=(DELETE|PUT|PATCH)`, "risky wget mutation method"),
  rx(String.raw`(169\.254\.169\.254|metadata\.google\.internal|metadata\.azure\.internal|metadata\.gce\.internal|instance-data|100\.100\.100\.200|fd00:ec2::254)`, "cloud metadata endpoint access"),

  rx(String.raw`${TOKEN}(python|python3|perl|ruby|node|deno|php|lua)\s+(-c|-e|-E|--eval|eval|-r)\s+.*(subprocess|os\.system|os\.popen|os\.exec|os\.fork|child_process|spawnSync|spawnsync|Deno\.(run|Command)|Open3|IO\.popen|Process\.spawn|shell_exec|passthru|popen\s*\(|system\s*\(|exec\s*\()`, "interpreter one-liner process execution"),
  rx(String.raw`${TOKEN}(python|python3|perl|ruby|node|deno|php)\s+(-c|-e|-E|--eval|eval|-r)\s+.*(os\.environ|process\.env|getenv|%ENV|boto3|botocore|kubernetes\.client|paramiko|fabric|hvac|google\.cloud|azure\.identity|azure\.mgmt)`, "interpreter one-liner secret or cloud SDK access"),
  rx(String.raw`${TOKEN}(python|python3|perl|ruby|node|deno|php)\s+(-c|-e|-E|--eval|eval|-r)\s+.*(requests|httpx|urllib3?|axios|http\.client)\.(delete|post|put|patch)`, "interpreter one-liner HTTP mutation"),
  rx(String.raw`${TOKEN}(python|python3|perl|ruby|node|deno|php)\s+(-c|-e|-E|--eval|eval|-r)\s+.*(socket\.(socket|connect|create_connection)|TCPSocket|Net::TCP|tls\.connect)`, "interpreter one-liner socket access"),
  rx(String.raw`${TOKEN}(bash\s+-i\s+>&\s*/dev/tcp|ruby\s+-rsocket|(nc|ncat)\s+-(e|c|l)|netcat\s+-l|ssh\s+-R|socat)`, "reverse shell or tunnel surface"),

  rx(String.raw`${TOKEN}rm\s+-[^\s]*r[^\s]*f[^\s]*\s+(/|~|\$HOME|/home|/var|/opt|/etc|/bin|/usr)`, "destructive filesystem removal"),
  rx(String.raw`${TOKEN}(mv|cp)\s+[^;&|]+\s+/(etc|usr|bin|sbin)`, "destructive system path overwrite"),
  rx(String.raw`(>|>>)\s*/(dev|proc|etc|var/log)`, "dangerous redirect to system path"),
  rx(String.raw`${TOKEN}ln\s+-sf${END}`, "force symlink mutation"),
  rx(String.raw`${TOKEN}chmod\s+(-R\s+)?(777|666)${END}`, "unsafe permissions"),
  rx(String.raw`${TOKEN}chown\s+(-R|root(:[^\s;&|]+)?)${END}`, "unsafe ownership mutation"),
  rx(String.raw`${TOKEN}chgrp\s+-R${END}`, "unsafe group mutation"),
  rx(String.raw`${TOKEN}(killall|pkill)\s+ssh${END}`, "SSH process termination"),
  rx(String.raw`${TOKEN}(nohup|disown|screen|crontab|watch)${END}`, "persistence or detached execution"),
  rx(String.raw`${TOKEN}at\s+(-?[fmlqrcvtMqcdb]|now|noon|midnight|teatime|tomorrow|next)`, "scheduled persistence"),
  rx(String.raw`${TOKEN}(echo|printf|cat|tee)[^;&|]*(>|>>|-a\s+)?[^;&|]*(\.bashrc|\.zshrc|\.profile|authorized_keys)`, "shell startup or SSH persistence"),
  rx(String.raw`${TOKEN}function\s+(sudo|rm|curl|wget|ssh|scp|kubectl|aws|gcloud|az|gh|git)\s*(\(\)|\{)`, "function shadowing of sensitive command"),
  rx(String.raw`${TOKEN}(sudo|rm|curl|wget|ssh|scp|kubectl|aws|gcloud|az|gh|git)\s*\(\)\s*\{`, "function shadowing of sensitive command"),
  rx(String.raw`${TOKEN}alias\s+(sudo|rm|curl|wget|ssh|scp|kubectl|aws|gcloud|az|gh|git)\s*=`, "alias shadowing of sensitive command"),
  rx(String.raw`${TOKEN}(base64\s+-d|openssl\s+enc\s+-d)[^;&|]*(\|\s*(bash|sh)|>\s*/tmp/)`, "decoded payload execution"),
  rx(String.raw`${TOKEN}eval[^;&|]*\$\([^)]*(curl|wget|base64|openssl)`, "eval downloader pattern"),
  rx(String.raw`: \(\) \{ :\|:& \};:|:\(\)\{:\|:&\};:`, "fork bomb"),

  rx(String.raw`${TOKEN}(qm\s+(destroy|stop|shutdown|reset|reboot|rollback|unlink|disk\s+unlink)|pct\s+(destroy|stop|shutdown|reboot|restore)|pvesh\s+delete|pvesm\s+(free|remove|delete)|ha-manager\s+(remove|disable|migrate|set)|pvecm\s+(delnode|expected))${END}`, "destructive Proxmox operation"),
  rx(String.raw`${TOKEN}(govc\s+(vm\.destroy|vm\.power\s+.*-off|vm\.unregister|datastore\.rm|object\.destroy|permissions\.set|role\.(create|remove|update))|esxcli\s+(system\s+(shutdown|maintenanceMode)|network\s+firewall\s+set[^;&|]*(--enabled[=\s]*false|-e[=\s]*false)|storage[^;&|]*(remove|delete|detach|unmount))|vim-cmd\s+vmsvc/(power\.off|destroy|unregister)|virsh\s+(destroy|undefine|vol-delete|pool-destroy)|ipmitool[^;&|]*(power\s+(off|cycle|reset)|chassis\s+power\s+(off|cycle|reset)))`, "destructive VM or hypervisor operation"),
  rx(String.raw`${TOKEN}(ceph\s+osd\s+(destroy|purge|out|rm)|zfs\s+destroy|btrfs\s+subvolume\s+delete|lvremove|vgremove|pvremove|mdadm[^;&|]*(--stop|--zero-superblock))${END}`, "destructive storage operation"),
  rx(String.raw`${TOKEN}(iptables\s+(-F|--flush)|nft\s+(flush|delete|destroy|reset)|ufw[^;&|]*disable|firewall-cmd[^;&|]*--panic-on|nmcli\s+networking\s+off|ip\s+route\s+(flush|del|delete|replace\s+default)|ip\s+addr\s+flush|ip\s+link\s+set[^;&|]*\s+down|resolvectl\s+dns[^;&|]*0\.0\.0\.0)`, "destructive network operation"),
  rx(String.raw`${TOKEN}(echo|printf|cat|sed)[^;&|]*(>|>>|-i)[^;&|]*(/etc/hosts|/etc/resolv\.conf)`, "host DNS or hosts mutation"),

  rx(String.raw`${TOKEN}(psql[^;&|]*\s+-c|mysql[^;&|]*\s+-e|sqlite3\s+[^;&|]*)[^;&|]*(drop|truncate)`, "destructive SQL operation"),
  rx(String.raw`${TOKEN}redis-cli[^;&|]*(flushall|flushdb)${END}`, "destructive Redis operation"),
  rx(String.raw`${TOKEN}promtool\s+tsdb\s+(delete|clean|bench-write)${END}`, "destructive Prometheus TSDB operation"),
]

const PROTECTED_PATH_PATTERNS: DenialPattern[] = [
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.env($|[^A-Za-z0-9_.-])`, ".env file"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.env\.[^\s;&|]*`, ".env.* file"),
  // rx(String.raw`\.pem($|[^A-Za-z0-9_./-])`, "PEM key file"),
  // rx(String.raw`\.key($|[^A-Za-z0-9_./-])`, "key file"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])(id_rsa|id_ed25519|id_ecdsa|id_dsa)($|[^A-Za-z0-9_-])`, "SSH private key"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])kubeconfig($|[^A-Za-z0-9_-])`, "kubeconfig"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])terraform\.tfstate(\.backup)?($|[^A-Za-z0-9_.-])`, "Terraform state"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])terraform\.tfvars($|[^A-Za-z0-9_.-])`, "Terraform variables"),
  // rx(String.raw`\.tfvars($|[^A-Za-z0-9_./-])`, "Terraform variables"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])secrets?\.ya?ml($|[^A-Za-z0-9_.-])`, "secret yaml"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])(vault\.ya?ml|\.vault_pass|vault-password-file)($|[^A-Za-z0-9_./-])`, "Ansible vault secret"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.sops\.yaml($|[^A-Za-z0-9_.-])`, "SOPS config"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.aws($|/|[^A-Za-z0-9_./-])`, "AWS config directory"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.azure($|/|[^A-Za-z0-9_./-])`, "Azure CLI auth state"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.kube($|/|[^A-Za-z0-9_./-])`, "Kubernetes config directory"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.config/gcloud($|/|[^A-Za-z0-9_./-])`, "gcloud auth state"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.config/glab-cli($|/|[^A-Za-z0-9_./-])`, "GitLab CLI auth state"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.config/age/keys\.txt($|[^A-Za-z0-9_./-])`, "age encryption private keys"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.ssh($|/|[^A-Za-z0-9_.-])`, "SSH config directory"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.gnupg($|/|[^A-Za-z0-9_.-])`, "GnuPG directory"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.password-store($|/|[^A-Za-z0-9_.-])`, "password store"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.netrc($|[^A-Za-z0-9_.-])`, ".netrc"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.npmrc($|[^A-Za-z0-9_.-])`, ".npmrc"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.pypirc($|[^A-Za-z0-9_.-])`, ".pypirc"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.gem/credentials($|[^A-Za-z0-9_./-])`, "RubyGems credentials"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.git-credentials($|[^A-Za-z0-9_.-])`, "Git credentials"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.(pgpass|my\.cnf|vault-token)($|[^A-Za-z0-9_.-])`, "local credential file"),
  // rx(String.raw`\.(p12|pfx|keystore|jks)($|[^A-Za-z0-9_./-])`, "certificate or keystore"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])credentials\.json($|[^A-Za-z0-9_.-])`, "credential JSON"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])application_default_credentials\.json($|[^A-Za-z0-9_.-])`, "application default credentials"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])client_secret[^\s;&|/]*\.json($|[^A-Za-z0-9_./-])`, "OAuth client secret JSON"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])service[_-]account[^\s;&|/]*\.json($|[^A-Za-z0-9_./-])`, "service account JSON"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])service-account[^\s;&|/]*\.json($|[^A-Za-z0-9_./-])`, "service account JSON"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.docker/config\.json($|[^A-Za-z0-9_./-])`, "Docker credential config"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.config/gh/hosts\.yml($|[^A-Za-z0-9_./-])`, "GitHub CLI hosts config"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.git/config($|[^A-Za-z0-9_./-])`, "Git config"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.git/hooks($|/|[^A-Za-z0-9_./-])`, "Git hooks"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])\.(bashrc|zshrc|profile|bash_profile|zprofile)($|[^A-Za-z0-9_.-])`, "shell startup file"),
  // rx(String.raw`(^|[^A-Za-z0-9_.-])\.config/systemd($|/|[^A-Za-z0-9_./-])`, "user systemd directory"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])(install-config\.yaml|kubeadmin-password|pull-secret|metadata\.json)($|[^A-Za-z0-9_.-])`, "OpenShift install secret"),
  // rx(String.raw`(^|[^A-Za-z0-9_-])auth/(kubeconfig|kubeadmin-password)($|[^A-Za-z0-9_./-])`, "OpenShift auth file"),
  rx(String.raw`(^|[^A-Za-z0-9_.-])\.codex/auth\.json($|[^A-Za-z0-9_./-])`, "Codex auth token"),
  rx(String.raw`(^|[^A-Za-z0-9_.-])\.local/share/opencode/auth\.json($|[^A-Za-z0-9_./-])`, "Opencode auth token"),
]

const FILE_TOOL = /(read|grep|glob|search|edit|write|patch|file)/i
const PATH_KEY = /^(file(path|name)?|path|paths|oldpath|newpath|source|target|destination|directory|dir|cwd|workdir|include|exclude|file_pattern|path_filter)$/i

export function normalizeCommand(command: string): string {
  return command.replace(/\\\r?\n/g, " ").replace(/[\r\n]+/g, "; ").replace(/\s+/g, " ").trim()
}

export function findDeniedBashCommand(command: string): Denial | null {
  const normalized = normalizeCommand(command)
  const protectedPath = findProtectedPathMention(normalized)
  if (protectedPath) return protectedPath

  for (const pattern of BASH_DENY_PATTERNS) {
    if (pattern.regex.test(normalized)) return { reason: pattern.reason, pattern: String(pattern.regex) }
  }
  return null
}

export function findProtectedPathMention(value: string): Denial | null {
  const normalized = value.replace(/\\/g, "/")
  for (const pattern of PROTECTED_PATH_PATTERNS) {
    if (pattern.regex.test(normalized)) return { reason: `protected path: ${pattern.reason}`, pattern: String(pattern.regex) }
  }
  return null
}

export function findProtectedFileToolAccess(tool: string, args: unknown): Denial | null {
  if (!FILE_TOOL.test(tool) || !args) return null
  return scanValue(args, false, /glob/i.test(tool))
}

function scanValue(value: unknown, pathContext: boolean, patternIsPath: boolean): Denial | null {
  if (typeof value === "string") {
    if (!pathContext) return null
    return findProtectedPathMention(value)
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const denied = scanValue(item, pathContext, patternIsPath)
      if (denied) return denied
    }
    return null
  }
  if (!value || typeof value !== "object") return null

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "patchText" && typeof child === "string") {
      const denied = scanPatchPaths(child)
      if (denied) return denied
      continue
    }
    const denied = scanValue(child, pathContext || PATH_KEY.test(key) || (patternIsPath && key === "pattern"), patternIsPath)
    if (denied) return denied
  }
  return null
}

function scanPatchPaths(patchText: string): Denial | null {
  for (const line of patchText.split("\n")) {
    const match = line.match(/^(?:\*\*\* (?:Add|Update|Delete) File:|\*\*\* Move to:|--- |\+\+\+)\s+(.+)$/)
    if (!match) continue
    const denied = findProtectedPathMention(match[1].replace(/^[ab]\//, ""))
    if (denied) return denied
  }
  return null
}
