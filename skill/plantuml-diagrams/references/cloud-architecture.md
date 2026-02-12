# Cloud & Infrastructure Architecture

## AWS Architecture

Use `awslib14` for best service coverage. Always include `AWSCommon` first.

```
@startuml
!include <awslib14/AWSCommon>
!include <awslib14/Compute/Lambda>
!include <awslib14/Database/DynamoDB>
!include <awslib14/ApplicationIntegration/APIGateway>
!include <awslib14/Storage/SimpleStorageService>

left to right direction

APIGateway(api, "API Gateway", "REST", "Entry point")
Lambda(fn, "Handler", "Go", "Business logic")
DynamoDB(db, "DynamoDB", "on-demand", "Storage")
SimpleStorageService(s3, "S3 Bucket", "Standard", "Assets")

api --> fn
fn --> db
fn --> s3
@enduml
```

### Macro Pattern

`ServiceName(alias, "Label", "Technology", "Description")`

### Key Service Paths (awslib14)

| Service | Include Path |
|---------|-------------|
| Lambda | `Compute/Lambda` |
| EC2 | `Compute/EC2` |
| ECS | `Compute/ECS` |
| EKS | `Compute/EKS` |
| Fargate | `Compute/Fargate` |
| API Gateway | `ApplicationIntegration/APIGateway` |
| SQS | `ApplicationIntegration/SimpleQueueService` |
| SNS | `ApplicationIntegration/SimpleNotificationService` |
| EventBridge | `ApplicationIntegration/EventBridge` |
| DynamoDB | `Database/DynamoDB` |
| RDS | `Database/RDS` |
| Aurora | `Database/Aurora` |
| ElastiCache | `Database/ElastiCache` |
| S3 | `Storage/SimpleStorageService` |
| EFS | `Storage/EFS` |
| CloudFront | `NetworkingContentDelivery/CloudFront` |
| ELB | `NetworkingContentDelivery/ElasticLoadBalancing` |
| Route53 | `NetworkingContentDelivery/Route53` |
| VPC | `NetworkingContentDelivery/VirtualPrivateCloud` |
| IAM | `SecurityIdentityCompliance/IdentityAccessManagementIAM` |
| Cognito | `SecurityIdentityCompliance/Cognito` |
| CloudWatch | `ManagementGovernance/CloudWatch` |
| StepFunctions | `ApplicationIntegration/StepFunctions` |

### VPC / Subnet Grouping

```
@startuml
!include <awslib14/AWSCommon>
!include <awslib14/Compute/EC2>
!include <awslib14/Database/RDS>
!include <awslib14/NetworkingContentDelivery/ElasticLoadBalancing>

rectangle "VPC" as vpc #LightBlue {
  rectangle "Public Subnet" as pub #LightGreen {
    ElasticLoadBalancing(alb, "ALB", "Application", "Load balancer")
  }
  rectangle "Private Subnet" as priv #LightYellow {
    EC2(app1, "App Server 1", "t3.medium", "")
    EC2(app2, "App Server 2", "t3.medium", "")
  }
  rectangle "Data Subnet" as data #LightPink {
    RDS(db, "PostgreSQL", "db.r5.large", "Primary")
  }
}

alb --> app1
alb --> app2
app1 --> db
app2 --> db
@enduml
```

### Serverless Architecture Example

```
@startuml
!include <awslib14/AWSCommon>
!include <awslib14/ApplicationIntegration/APIGateway>
!include <awslib14/Compute/Lambda>
!include <awslib14/Database/DynamoDB>
!include <awslib14/ApplicationIntegration/SimpleQueueService>
!include <awslib14/ApplicationIntegration/SimpleNotificationService>
!include <awslib14/Storage/SimpleStorageService>

left to right direction

APIGateway(api, "API Gateway", "REST", "")
Lambda(handler, "API Handler", "Go", "")
Lambda(worker, "Worker", "Go", "")
DynamoDB(db, "Orders", "on-demand", "")
SimpleQueueService(queue, "Task Queue", "Standard", "")
SimpleNotificationService(notify, "Notifications", "Topic", "")
SimpleStorageService(s3, "Assets", "Standard", "")

api --> handler
handler --> db
handler --> queue
queue --> worker
worker --> db
worker --> notify
handler --> s3
@enduml
```

## Azure Architecture

```
@startuml
!include <azure/AzureCommon>
!include <azure/Compute/AzureFunction>
!include <azure/Databases/AzureCosmosDb>
!include <azure/Analytics/AzureEventHub>
!include <azure/Analytics/AzureStreamAnalyticsJob>

left to right direction

AzureEventHub(hub, "Event Hub", "Ingestion")
AzureStreamAnalyticsJob(stream, "Stream Analytics", "Processing")
AzureFunction(fn, "Function", "Handler")
AzureCosmosDb(db, "Cosmos DB", "Storage")

hub --> stream
stream --> fn
fn --> db
@enduml
```

### Key Azure Paths

| Service | Include Path |
|---------|-------------|
| Functions | `Compute/AzureFunction` |
| App Service | `Compute/AzureAppService` |
| AKS | `Compute/AzureKubernetesService` |
| Cosmos DB | `Databases/AzureCosmosDb` |
| SQL Database | `Databases/AzureSqlDatabase` |
| Event Hub | `Analytics/AzureEventHub` |
| Service Bus | `Integration/AzureServiceBus` |
| Blob Storage | `Storage/AzureBlobStorage` |
| API Management | `Integration/AzureAPIManagement` |

## GCP Architecture

```
@startuml
!include <gcp/GCPCommon>
!include <gcp/Compute/Cloud_Functions>
!include <gcp/Databases/Cloud_Firestore>
!include <gcp/Storage/Cloud_Storage>

left to right direction

Cloud_Functions(fn, "Function", "Handler")
Cloud_Firestore(db, "Firestore", "NoSQL")
Cloud_Storage(storage, "GCS", "Bucket")

fn --> db
fn --> storage
@enduml
```

### Key GCP Paths

| Service | Include Path |
|---------|-------------|
| Cloud Functions | `Compute/Cloud_Functions` |
| Cloud Run | `Compute/Cloud_Run` |
| GKE | `Compute/Google_Kubernetes_Engine` |
| Cloud SQL | `Databases/Cloud_SQL` |
| Firestore | `Databases/Cloud_Firestore` |
| BigQuery | `Data_Analytics/BigQuery` |
| Pub/Sub | `Data_Analytics/Cloud_PubSub` |
| Cloud Storage | `Storage/Cloud_Storage` |

## Kubernetes

### Using kubernetes stdlib

```
@startuml
!include <kubernetes/k8s-sprites-unlabeled-25pct>

package "Kubernetes Cluster" {
  node "Node 1" {
    component "<$pod>\nAPI Pod" as api
    component "<$pod>\nWorker Pod" as worker
  }
  component "<$svc>\nService" as svc
  component "<$ing>\nIngress" as ing
}

database "PostgreSQL" as db

ing --> svc
svc --> api
api --> worker
worker --> db
@enduml
```

### Available K8s Sprites

| Sprite | Description |
|--------|-------------|
| `$pod` | Pod |
| `$svc` | Service |
| `$ing` | Ingress |
| `$deploy` | Deployment |
| `$rs` | ReplicaSet |
| `$ds` | DaemonSet |
| `$sts` | StatefulSet |
| `$job` | Job |
| `$cj` | CronJob |
| `$cm` | ConfigMap |
| `$secret` | Secret |
| `$pv` | PersistentVolume |
| `$pvc` | PersistentVolumeClaim |
| `$ns` | Namespace |
| `$node` | Node |
| `$sa` | ServiceAccount |
| `$role` | Role |
| `$rb` | RoleBinding |
| `$hpa` | HorizontalPodAutoscaler |
| `$sc` | StorageClass |
| `$ep` | Endpoints |
| `$netpol` | NetworkPolicy |

### K8s with Cloud Provider

```
@startuml
!include <kubernetes/k8s-sprites-unlabeled-25pct>
!include <awslib14/AWSCommon>
!include <awslib14/NetworkingContentDelivery/ElasticLoadBalancing>
!include <awslib14/Database/RDS>

ElasticLoadBalancing(alb, "ALB", "Application", "")

package "EKS Cluster" {
  component "<$ing>\nIngress" as ing
  component "<$svc>\nService" as svc
  component "<$pod>\nApp" as app
}

RDS(db, "PostgreSQL", "db.r5.large", "")

alb --> ing
ing --> svc
svc --> app
app --> db
@enduml
```

## C4 Model

### C4 Context Diagram

```
@startuml
!include <C4/C4_Context>

Person(user, "Customer", "A user of the system")
System(sys, "E-Commerce", "Handles orders and payments")
System_Ext(payment, "Payment Gateway", "Processes payments")
System_Ext(email, "Email Service", "Sends notifications")

Rel(user, sys, "Uses", "HTTPS")
Rel(sys, payment, "Processes payments", "API")
Rel(sys, email, "Sends emails", "SMTP")
@enduml
```

### C4 Container Diagram

```
@startuml
!include <C4/C4_Container>

Person(user, "Customer", "A user")

System_Boundary(sys, "E-Commerce System") {
  Container(web, "Web App", "React", "Frontend SPA")
  Container(api, "API", "Go", "REST API")
  ContainerDb(db, "Database", "PostgreSQL", "Stores orders, users")
  ContainerQueue(queue, "Message Queue", "RabbitMQ", "Async processing")
  Container(worker, "Worker", "Go", "Background jobs")
}

System_Ext(payment, "Stripe", "Payment processing")

Rel(user, web, "Uses", "HTTPS")
Rel(web, api, "Calls", "JSON/HTTPS")
Rel(api, db, "Reads/Writes", "SQL")
Rel(api, queue, "Publishes", "AMQP")
Rel(queue, worker, "Consumes", "AMQP")
Rel(api, payment, "Charges", "API")
@enduml
```

### C4 Macros Reference

| Macro | Use |
|-------|-----|
| `Person(alias, label, descr)` | External user/actor |
| `Person_Ext(alias, label, descr)` | External person |
| `System(alias, label, descr)` | Internal system |
| `System_Ext(alias, label, descr)` | External system |
| `System_Boundary(alias, label)` | System boundary group |
| `Container(alias, label, techn, descr)` | Container (app, service) |
| `ContainerDb(alias, label, techn, descr)` | Database container |
| `ContainerQueue(alias, label, techn, descr)` | Queue container |
| `Container_Boundary(alias, label)` | Container boundary group |
| `Component(alias, label, techn, descr)` | Component inside container |
| `ComponentDb(alias, label, techn, descr)` | Database component |
| `Deployment_Node(alias, label, techn, descr)` | Deployment node |
| `Rel(from, to, label, techn)` | Relationship |
| `Rel_U/D/L/R(from, to, label)` | Directional relationship |
| `BiRel(from, to, label)` | Bidirectional |
| `Lay_U/D/L/R(from, to)` | Layout hint (no visible line) |

### C4 Include Files

| Level | Include |
|-------|---------|
| Context | `!include <C4/C4_Context>` |
| Container | `!include <C4/C4_Container>` |
| Component | `!include <C4/C4_Component>` |
| Deployment | `!include <C4/C4_Deployment>` |
| Dynamic | `!include <C4/C4_Dynamic>` |
| Sequence | `!include <C4/C4_Sequence>` |

### C4 Tags and Legend

```
AddElementTag("v1.0", $borderColor="#d73027", $fontColor="#d73027")
AddRelTag("async", $lineColor="orange", $lineStyle=DashedLine())

Container(api, "API", "Go", "v1.0 service", $tags="v1.0")
Rel(api, queue, "Publishes", "AMQP", $tags="async")

SHOW_LEGEND()
```

## Combining Libraries

Mix cloud sprites with C4 for rich architecture diagrams:

```
@startuml
!include <C4/C4_Container>
!include <awslib14/AWSCommon>
!include <awslib14/Compute/Lambda>
!include <awslib14/Database/DynamoDB>

Person(user, "User", "Customer")

System_Boundary(sys, "System") {
  Container(api, "API", "Lambda", "Serverless API", $sprite="Lambda")
  ContainerDb(db, "Data", "DynamoDB", "NoSQL store", $sprite="DynamoDB")
}

Rel(user, api, "Uses", "HTTPS")
Rel(api, db, "Reads/Writes")
@enduml
```

## Other Icon Libraries

| Library | Include | Use Case |
|---------|---------|----------|
| `<logos/...>` | Tech logos (docker, terraform, go, python) | Generic tech diagrams |
| `<cloudinsight/...>` | Cloud tech (kafka, cassandra, java) | Infrastructure |
| `<tupadr3/font-awesome/...>` | Font Awesome icons | General purpose |
| `<tupadr3/devicons/...>` | Dev tool icons | Development tooling |
| `<elastic/...>` | ELK stack icons | Observability |
| `<cloudogu/tools/k8s>` | K8s icon | Simple K8s reference |
