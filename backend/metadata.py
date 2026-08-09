import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    http_method = event.get('httpMethod')

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if http_method == 'GET':
        try:
            # Note: For production, you might want to query by a specific User ID index
            response = table.scan()
            items = response.get('Items', [])
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'files': items})
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    elif http_method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))

            # Required fields
            required_fields = ['id', 'name', 'type', 'size', 's3Key']
            for field in required_fields:
                if field not in body:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': f'Missing required field: {field}'})
                    }

            item = {
                'id': body['id'],
                'name': body['name'],
                'type': body['type'],
                'size': body['size'],
                's3Key': body['s3Key'],
                'date': body.get('date', datetime.utcnow().isoformat()),
                'status': body.get('status', 'Completed'),
                'userId': body.get('userId', 'default-user')
            }

            table.put_item(Item=item)

            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(item)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'})
    }
