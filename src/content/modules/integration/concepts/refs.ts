/** Referências oficiais da trilha Integração e mensageria na AWS (conferidas em 22/10/2026). */
const sqs = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/${page}` })
const sns = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/sns/latest/dg/${page}` })
const eb = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/eventbridge/latest/userguide/${page}` })
const sfn = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/step-functions/latest/dg/${page}` })
const apigw = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/apigateway/latest/developerguide/${page}` })
const kds = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/streams/latest/dev/${page}` })
const mq = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/${page}` })
const lambda = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/lambda/latest/dg/${page}` })

export const R = {
  sqsWhat: sqs('What is Amazon Simple Queue Service?', 'welcome.html'),
  sqsStandard: sqs('Amazon SQS standard queues', 'standard-queues.html'),
  sqsVisibility: sqs('Amazon SQS visibility timeout', 'sqs-visibility-timeout.html'),
  sqsMessageQuotas: sqs('Amazon SQS message quotas', 'quotas-messages.html'),
  sqsPolling: sqs('Amazon SQS short and long polling', 'sqs-short-and-long-polling.html'),
  sqsDlq: sqs('Using dead-letter queues in Amazon SQS', 'sqs-dead-letter-queues.html'),
  sqsFifo: sqs('Amazon SQS FIFO queues', 'sqs-fifo-queues.html'),
  sqsExactlyOnce: sqs('Exactly-once processing in Amazon SQS', 'FIFO-queues-exactly-once-processing.html'),
  sqsHighThroughput: sqs('High throughput for FIFO queues in Amazon SQS', 'high-throughput-fifo.html'),
  sqsDelay: sqs('Amazon SQS delay queues', 'sqs-delay-queues.html'),
  sqsLarge: sqs('Managing large Amazon SQS messages using Java and Amazon S3', 'sqs-s3-messages.html'),
  lambdaSqs: lambda('Using Lambda with Amazon SQS', 'with-sqs.html'),
  lambdaSqsConfig: lambda('Creating and configuring an Amazon SQS event source mapping', 'services-sqs-configure.html'),
  lambdaSqsScaling: lambda('Configuring scaling behavior for SQS event source mappings', 'services-sqs-scaling.html'),
  lambdaSqsErrors: lambda('Handling errors for an SQS event source in Lambda', 'services-sqs-errorhandling.html'),
  snsWhat: sns('What is Amazon SNS?', 'welcome.html'),
  snsFiltering: sns('Amazon SNS message filtering', 'sns-message-filtering.html'),
  snsFilterPolicies: sns('Amazon SNS subscription filter policies', 'sns-subscription-filter-policies.html'),
  snsRetries: sns('Amazon SNS message delivery retries', 'sns-message-delivery-retries.html'),
  snsDlq: sns('Amazon SNS dead-letter queues', 'sns-dead-letter-queues.html'),
  snsFifo: sns('Message ordering and deduplication strategies using Amazon SNS FIFO topics', 'sns-fifo-topics.html'),
  snsFanout: sns('Fanout Amazon SNS notifications to Amazon SQS queues for asynchronous processing', 'sns-sqs-as-subscriber.html'),
  ebPatterns: eb('Amazon EventBridge event patterns', 'eb-event-patterns.html'),
  ebOperators: eb('Comparison operators for use in event patterns in Amazon EventBridge', 'eb-create-pattern-operators.html'),
  ebBus: eb('Amazon EventBridge event bus (default and Classic)', 'eb-event-bus.html'),
  ebRules: eb('Rules in Amazon EventBridge', 'eb-rules.html'),
  ebTargets: eb('Event bus targets in Amazon EventBridge', 'eb-targets.html'),
  ebCrossAccount: eb('Sending and receiving events between AWS accounts in Amazon EventBridge', 'eb-cross-account.html'),
  ebArchive: eb('Archiving and replaying events in Amazon EventBridge', 'eb-archive.html'),
  ebPipes: eb('Amazon EventBridge Pipes', 'eb-pipes.html'),
  scheduler: { title: 'What is Amazon EventBridge Scheduler?', url: 'https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html' },
  sfnWhat: sfn('What is Step Functions?', 'welcome.html'),
  sfnTypes: sfn('Choosing workflow type in Step Functions', 'choosing-workflow-type.html'),
  sfnStates: sfn('Discovering workflow states to use in Step Functions', 'workflow-states.html'),
  sfnErrors: sfn('Handling errors in Step Functions workflows', 'concepts-error-handling.html'),
  sfnPatterns: sfn('Discover service integration patterns in Step Functions', 'connect-to-resource.html'),
  apigwWhat: apigw('What is Amazon API Gateway?', 'welcome.html'),
  apigwRestVsHttp: apigw('Choose between REST APIs and HTTP APIs', 'http-api-vs-rest.html'),
  apigwEndpoints: apigw('API endpoint types for REST APIs in API Gateway', 'api-gateway-api-endpoint-types.html'),
  apigwThrottling: apigw('Throttle requests to your REST APIs for better throughput in API Gateway', 'api-gateway-request-throttling.html'),
  apigwUsagePlans: apigw('Usage plans and API keys for REST APIs in API Gateway', 'api-gateway-api-usage-plans.html'),
  apigwCache: apigw('Cache settings for REST APIs in API Gateway', 'api-gateway-caching.html'),
  kdsConcepts: kds('Amazon Kinesis Data Streams Terminology and concepts', 'key-concepts.html'),
  kdsLimits: kds('Quotas and limits', 'service-sizes-and-limits.html'),
  kdsEfo: kds('Develop enhanced fan-out consumers with dedicated throughput', 'enhanced-consumers.html'),
  sagaOrchestration: { title: 'Saga orchestration pattern', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html' },
  sagaChoreography: { title: 'Saga choreography pattern', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html' },
  mqWhat: mq('What is Amazon MQ?', 'welcome.html'),
  mqArchitecture: mq('Deployment options for Amazon MQ for ActiveMQ brokers', 'amazon-mq-broker-architecture.html'),
}
