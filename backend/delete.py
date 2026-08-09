import json
import boto3
import os

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET_NAME = os.environ.get('BUCKET_NAME')
TABLE_NAME = os.environ.get('TABLE_NAME')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
    }

    try:
        # Assuming ID is passed in path parameters e.g., /files/{id}
        path_parameters = event.get('pathParameters', {}) or {}
        file_id = path_parameters.get('id')

        if not file_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing file ID in path parameters'})
            }

        # 1. Get the item to find the s3Key
        response = table.get_item(Key={'id': file_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'File not found'})
            }

        item = response['Item']
        s3_key = item.get('s3Key')

        # 2. Delete from S3
        if s3_key:
            try:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
            except Exception as e:
                print(f"Error deleting from S3: {str(e)}")
                # Continue to delete from DynamoDB even if S3 delete fails

        # 3. Delete from DynamoDB
        table.delete_item(Key={'id': file_id})

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'File deleted successfully', 'id': file_id})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
