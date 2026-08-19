import json
import boto3
import os
import uuid
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName')

        if not file_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'fileName is required'})
            }

        file_key = f"{uuid.uuid4()}-{file_name}"

        # Generate presigned URL for PUT
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key
            },
            ExpiresIn=3600
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'fileKey': file_key
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
