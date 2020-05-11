'use strict';
var expect = require('chai').expect;
var index = require('../dist/index.js');

describe('message-envelope', () => {

   it('should be valid minimal envelope', async () => {
      const message = new index.Envelope();
      message.setPayloadIdentifier('company_logo.jpg');
      expect(message.getPayloadIdentifier()).to.eql('company_logo.jpg');

      message.setPayloadType('image/jpg');
      expect(message.getPayloadType()).to.eql('image/jpg');

      const data = Buffer.from('hello world2', 'utf8');
      message.setPayload(data);
      expect(message.getPayload().toString('hex')).to.eql(data.toString('hex'));
      expect(message).to.eql({
         "encryptedPayloads_": [],
         "metanet_": undefined,
         "payloadIdentifier_": "company_logo.jpg",
         "payloadProtocol_": "F",
         "payloadType_": "image/jpg",
         "payloadVersion_": 0,
         "payload_": Buffer.from([
            104,
            101,
            108,
            108,
            111,
            32,
            119,
            111,
            114,
            108,
            100,
            50,
         ])
      });

      const outputScript = message.toScript();
      expect(outputScript.toASM()).to.eql('0 OP_RETURN bd00 46 08001209696d6167652f6a70671a10636f6d70616e795f6c6f676f2e6a7067 68656c6c6f20776f726c6432');

      const fromScriptMessage = index.Envelope.fromScript(outputScript);
      expect(fromScriptMessage).to.eql(message);

   });

   it('should be valid minimal envelope with metanet node', async () => {
      const message = new index.Envelope();
      message.setPayloadIdentifier('company_logo.jpg');
      expect(message.getPayloadIdentifier()).to.eql('company_logo.jpg');

      message.setPayloadType('image/jpg');
      expect(message.getPayloadType()).to.eql('image/jpg');

      const data = Buffer.from('hello world2', 'utf8');
      message.setPayload(data);
      expect(message.getPayload().toString('hex')).to.eql(data.toString('hex'));
      expect(message).to.eql({
         "encryptedPayloads_": [],
         "metanet_": undefined,
         "payloadIdentifier_": "company_logo.jpg",
         "payloadProtocol_": "F",
         "payloadType_": "image/jpg",
         "payloadVersion_": 0,
         "payload_": Buffer.from([
            104,
            101,
            108,
            108,
            111,
            32,
            119,
            111,
            114,
            108,
            100,
            50,
         ])
      });

      const outputScript = message.toScript();
      expect(outputScript.toASM()).to.eql('0 OP_RETURN bd00 46 08001209696d6167652f6a70671a10636f6d70616e795f6c6f676f2e6a7067 68656c6c6f20776f726c6432');

      const fromScriptMessage = index.Envelope.fromScript(outputScript);
      expect(fromScriptMessage).to.eql(message);

   });

});