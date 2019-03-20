# Graasp Service Exporter

Service to export PDF, PNG and EPUB versions of learning spaces on Graasp.

## Requirements

Make sure you have `node` and `yarn` installed.

## Getting Started

Clone or fork the repository.

In your project root folder run the following command to install dependencies.

```bash
yarn
```

Make sure you have the correct local environment variables in your `env.local.json` file.

Run the service locally.

```bash
yarn start:local
```

## Deploying

Deployment happens to the AWS account you have set up locally.

### Development

Make sure you have the correct development environment variables in your `env.dev.json` file.

Deploy the service to your development environment.

```bash
yarn deploy:dev
```

### Production

Make sure you have the correct development environment variables in your `env.prod.json` file.

Deploy the service to your production environment.

```bash
yarn deploy:prod
```
