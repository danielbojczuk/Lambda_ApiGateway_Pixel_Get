#!/bin/bash
DIRECTORY=$(cd `dirname $0` && pwd)
cd $DIRECTORY/Function 
zip -r Function.zip *
mv Function.zip $DIRECTORY/Deploy/
cd $DIRECTORY
aws s3api put-object \
  --bucket cloud-formation-bucket-avante \
  --key ApiGateway_Pixel_Get \
  --region us-east-1 \
  --body ./Deploy/Function.zip
aws lambda update-function-code \
    --function-name  ApiGateway_Pixel_Get \
    --s3-bucket cloud-formation-bucket-avante \
    --s3-key ApiGateway_Pixel_Get
