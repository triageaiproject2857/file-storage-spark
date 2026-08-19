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
# AWS Setup Guide for CloudVault

This guide provides step-by-step instructions for provisioning the necessary AWS resources for the CloudVault application.

## 1. Setting up S3 bucket CORS, Versioning, and Lifecycle policies

1. **Create the S3 Bucket:**
   - Log in to the AWS Management Console and navigate to **S3**.
   - Click **Create bucket**.
   - Enter a unique bucket name (e.g., `cloudvault-storage-[your-unique-id]`).
   - Select your desired AWS Region.
   - Leave other default settings (Block Public Access enabled) and click **Create bucket**.

2. **Configure CORS:**
   - Go to your newly created bucket and select the **Permissions** tab.
   - Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
   - Paste the following JSON configuration to allow your frontend to upload/download files directly (adjust `AllowedOrigins` as needed for production):
     ```json
     [
         {
             "AllowedHeaders": ["*"],
             "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
             "AllowedOrigins": ["*"],
             "ExposeHeaders": ["ETag"]
         }
     ]
     ```
   - Click **Save changes**.

3. **Enable Versioning:**
   - Select the **Properties** tab for your bucket.
   - Under **Bucket Versioning**, click **Edit**.
   - Select **Enable** and click **Save changes**.

4. **Set Lifecycle Policies:**
   - Go to the **Management** tab and click **Create lifecycle rule**.
   - Name the rule (e.g., `DeleteOldVersionsAndDeletedFiles`).
   - Choose **Apply to all objects in the bucket**.
   - Under **Lifecycle rule actions**, select:
     - *Permanently delete noncurrent versions of objects*
     - *Expire current versions of objects* (optional, if you want all objects to expire after 90 days).
   - Configure the timeline (e.g., 90 days after becoming noncurrent).
   - Click **Create rule**.

## 2. Deploying DynamoDB tables and configuring primary/sort keys

1. **Create the Table:**
   - Navigate to the **DynamoDB** console.
   - Click **Create table**.
   - **Table name**: `CloudVaultFiles`
   - **Partition key (Primary key)**: `user_id` (String)
   - **Sort key**: `file_id` (String)
   - Leave Default settings for table settings or customize capacity if needed.
   - Click **Create table**.

2. **Optional: Add Global Secondary Indexes (GSI):**
   - If you frequently query by file status or upload date for cleanup tasks, you may want to create a GSI on `status` or `upload_date`.

## 3. Deploying Lambda functions and attaching IAM Execution Roles

1. **Create IAM Role:**
   - Navigate to the **IAM** console.
   - Click **Roles** -> **Create role**.
   - Select **AWS service** -> **Lambda**.
   - Attach the following managed policies:
     - `AWSLambdaBasicExecutionRole`
     - `AmazonS3FullAccess` (or restrict to your specific bucket)
     - `AmazonDynamoDBFullAccess` (or restrict to your specific table)
     - `AmazonSNSFullAccess` (for the notifications Lambda)
   - Name the role (e.g., `CloudVaultLambdaRole`) and create it.

2. **Deploy the Cleanup Lambda:**
   - Navigate to the **Lambda** console and click **Create function**.
   - Name it `CloudVaultCleanup`.
   - Runtime: **Python 3.9** (or latest).
   - Under **Execution role**, choose **Use an existing role** and select the `CloudVaultLambdaRole` created earlier.
   - Copy the contents of `/backend/cleanup_lambda.py` into the inline code editor or upload as a ZIP.
   - Set environment variables:
     - `DYNAMODB_TABLE_NAME`: `CloudVaultFiles`
     - `S3_BUCKET_NAME`: your S3 bucket name.
   - Click **Deploy**.
   - Configure an **EventBridge (CloudWatch Events)** trigger to run this function on a schedule (e.g., `rate(1 day)`).

3. **Deploy the Notifications Lambda:**
   - Repeat the process to create another function named `CloudVaultNotifications`.
   - Copy the contents of `/backend/notifications.py`.
   - Set environment variable: `SNS_TOPIC_ARN` to your SNS Topic ARN.
   - Click **Deploy**.

## 4. Linking API Gateway endpoints to the frontend `.env` configuration file

1. **Create an API Gateway (REST or HTTP API):**
   - In the API Gateway console, build a new API and define routes (e.g., `POST /upload`, `GET /files`).
   - Integrate these routes with your backend Lambda functions or other backend services.
   - Deploy the API to a stage (e.g., `prod`).
   - Copy the **Invoke URL** (e.g., `https://abcdef123.execute-api.us-east-1.amazonaws.com/prod`).

2. **Update Frontend `.env` File:**
   - In the root of your frontend project, open or create the `.env.local` or `.env` file.
   - Add your API Gateway URL and any other necessary configuration values:
     ```env
     NEXT_PUBLIC_API_BASE_URL=https://abcdef123.execute-api.us-east-1.amazonaws.com/prod
     # If using Cognito for auth, add those parameters as well
     NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
     NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx
     ```
   - Restart your Next.js development server for the changes to take effect.
