const UUID = require('uuidv4');
const AWS = require('aws-sdk');
AWS.config.update({
    region: "us-east-1",
  });
const S3 = new AWS.S3();
var DocClient = new AWS.DynamoDB.DocumentClient();
var _Lambda = new AWS.Lambda({
    region: 'us-east-1' //change to your region
  });
exports.handler =  async (event, context) => {
    
    console.log("Iniciando funcao"); 
    console.log(event);
    /*
    {
        guid: '123',
        sourceIP: 'test-invoke-source-ip',
        userAgent: 'aws-internal/3 aws-sdk-java/1.11.783 Linux/4.9.184-0.1.ac.235.83.329.metal1.x86_64 OpenJDK_64-Bit_Server_VM/25.252-b09 java/1.8.0_252 vendor/Oracle_Corporation'
    } */
    
    try {
        if(event.guid === "" || !UUID.isUuid(event.guid)) {
            console.error("Parametros Invalidos");
            return;
        }
        var params = {
            TableName: 'ResultadoCampanha',
            Key:{
                "id": event.guid
            }
        };
        let dynamoInput;
        if(event.email == 1) {
            dynamoInput = {
                TableName: "PixelView",
                Item: {
                    idEnvioEmail: event.guid,
                    data: Date.now(),
                    sourceIP: event.sourceIP,
                    userAgent: event.userAgent,
                    idResultadoCampanha: event.guid,
                    Email:1
                }
            }
        } else {
            let resultadoCampanha = await DocClient.get(params).promise();
            let evento = {
                campanha: resultadoCampanha.Item.campanha
            }
            let retornoFunction = await _Lambda.invoke({
                FunctionName: 'Internal_Campanha_Get',
                Payload: JSON.stringify(evento, null, 2) // pass params
            }).promise();
            if(retornoFunction.Payload == "{}" || retornoFunction.hasOwnProperty("FunctionError")) {
                console.error("Campanha não encontrada");
                return;
            }
            campanha = JSON.parse(retornoFunction.Payload);
            dynamoInput = {
                TableName: "PixelView",
                Item: {
                    idResultadoCampanha: event.guid,
                    data: Date.now(),
                    sourceIP: event.sourceIP,
                    userAgent: event.userAgent,
                    campanha: resultadoCampanha.Item.campanha 
                }
            }
        }
        await DocClient.put(dynamoInput).promise();

        const data = await S3.getObject({Bucket: 'campanhafacil-upload', Key: "pixel.png"}).promise();
        return data.Body.toString('base64');
        }
    catch (err) {
        console.log(err);
        return {
            statusCode: err.statusCode || 400,
            body: err.message || JSON.stringify(err.message)
        }
    }
};