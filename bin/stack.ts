import {App, Construct, Stack, StackProps} from "@aws-cdk/core";
import {NetworkLayer} from "../lib/network-layer";
import {DataLayer} from "../lib/data-layer";
import {DeploymentLayer} from "../lib/deployment-layer";
import {ServiceFactory} from "../lib/service-layer/factory/service-factory";
import {Service} from "../lib/configurations/service";
import {Infrastructure} from "../lib/configurations/infra";
import {Database} from "../lib/configurations/database";
import {Cache} from "../lib/configurations/cache";
import {Deployment} from "../lib/configurations/deployment";

class CompleteStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const cache: Cache = {
            name: 'rails-hello',
            id: 'rails-hello',
            cacheConfig: 'Redis'
        }

        const database: Database = {
            name: 'rails_hello',
            databaseConfig: 'Aurora',
            databasePasswordPrefix: 'rails-hello'
        }

        const service: Service = {
            name: 'rails-hello',
            protocol: 'HTTP',
            serverConfig: 'Fargate',
            repoName: 'rails-hello',
            framework: 'Rails',
            zoneName: 'hypto.com',
            endpoint: 'rails-hello.hypto.com',
            directory: '../payment-operations'
        }

        const deployment: Deployment = {
            deploymentConfig: 'CI-CD',
            deploymentParamPrefix: 'rails-hello',
            // slackConfigId: 'RailsHello',
            // slackConfigName: 'rails-hello'
        }

        const infraConfig : Infrastructure = {
            deployment,
            cache,
            database,
            service
        }

        const networkLayer = new NetworkLayer(this, 'NetworkLayer', { conf: infraConfig });
        const dataLayer = new DataLayer(this, 'DataLayer', {
            networkLayer,
            cache: infraConfig.cache,
            database: infraConfig.database
        });

        const serviceFactory = ServiceFactory.instance(service);
        serviceFactory.serviceLayer(this, 'ServiceLayer', {
            service,
            networkLayer,
            dataLayer,
            cacheConf: infraConfig.cache.cacheConfig,
            dbConf: infraConfig.database.databaseConfig
        });

        new DeploymentLayer(this, 'CICDLayer', { serviceFactory, deployment });
    }
}

const app = new App();
new CompleteStack(app, 'RailsHello', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    }
});
app.synth();
