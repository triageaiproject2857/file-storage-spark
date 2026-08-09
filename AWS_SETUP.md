# AWS Real Backend Setup Guide

This document outlines the steps required to deploy the Cloud-Based Backup System's real AWS backend using AWS Lambda, API Gateway, S3, and DynamoDB.

## Prerequisites

1. **AWS Account**: You need an active AWS account.
2. **AWS CLI**: Installed and configured with appropriate permissions.
3. **Python 3.x**: Installed locally for packaging Lambdas if needed (the provided scripts use standard `boto3` which is available by default in the Lambda environment).

## 1. Set Up S3 Bucket

1. Go to the AWS S3 Console.
2. Click **Create bucket**.
3. Enter a unique bucket name (e.g., `cloudvault-backups-[your-id]`).
4. Choose the AWS Region.
5. Under **Object Ownership**, keep **ACLs disabled**.
6. Under **Block Public Access settings**, keep **Block all public access** checked (access will be granted via pre-signed URLs).
7. Configure **CORS (Cross-Origin Resource Sharing)** in the bucket permissions tab:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["PUT", "GET"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": []
       }
   ]
   ```
8. Click **Create bucket**.

## 2. Set Up DynamoDB Table

1. Go to the AWS DynamoDB Console.
2. Click **Create table**.
3. Set **Table name** to `CloudVaultMetadata`.
4. Set **Partition key** to `id` (String).
5. Leave other settings as default and click **Create table**.

## 3. Create IAM Role for Lambda

1. Go to the AWS IAM Console.
2. Select **Roles** > **Create role**.
3. Choose **AWS service** > **Lambda**.
4. Attach the following policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
5. Create an inline policy with permissions for S3 and DynamoDB:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:DeleteObject"
               ],
               "Resource": "arn:aws:s3:::cloudvault-backups-[your-id]/*"
           },
           {
               "Effect": "Allow",
               "Action": [
                   "dynamodb:PutItem",
                   "dynamodb:GetItem",
                   "dynamodb:Scan",
                   "dynamodb:DeleteItem"
               ],
               "Resource": "arn:aws:dynamodb:[region]:[account-id]:table/CloudVaultMetadata"
           }
       ]
   }
   ```
6. Name the role `CloudVaultLambdaRole` and save.

## 4. Deploy Lambda Functions

For each function in the `backend/` directory (`upload.py`, `metadata.py`, `delete.py`), follow these steps:

1. Go to the AWS Lambda Console and click **Create function**.
2. Choose **Author from scratch**.
3. Name the function (e.g., `CloudVault-Upload`, `CloudVault-Metadata`, `CloudVault-Delete`).
4. Select **Python 3.12** (or latest 3.x) as the Runtime.
5. Under **Permissions**, choose **Use an existing role** and select `CloudVaultLambdaRole`.
6. Click **Create function**.
7. In the code editor, copy and paste the contents of the respective `.py` file from the `backend/` directory.
8. Click **Deploy**.
9. Go to **Configuration** > **Environment variables** and add:
   - For all functions: `BUCKET_NAME` = `cloudvault-backups-[your-id]`
   - For all functions: `TABLE_NAME` = `CloudVaultMetadata`

## 5. Set Up API Gateway

1. Go to the AWS API Gateway Console.
2. Choose **HTTP API** and click **Build**.
3. Add integrations for your Lambda functions:
   - Integration type: Lambda
   - Integration target: `CloudVault-Upload`
   - Method: POST
   - Path: `/api/upload`
4. Repeat for metadata and delete:
   - Target: `CloudVault-Metadata`, Method: ANY (or configure GET and POST separately), Path: `/api/metadata`
   - Target: `CloudVault-Delete`, Method: DELETE, Path: `/api/files/{id}`
5. Configure CORS in API Gateway:
   - Allow Origins: `*` (or your specific frontend domain)
   - Allow Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
   - Allow Headers: `Content-Type`
6. Deploy the API and note the Invoke URL.

## 6. Configure the Frontend

Once the API Gateway is deployed, update your frontend configuration:

1. Open `lib/awsService.ts`.
2. Change the `USE_MOCK_AWS` toggle to `false`.
3. Update the `API_BASE_URL` constant with your API Gateway Invoke URL.

Your application is now configured to use the real AWS backend!
