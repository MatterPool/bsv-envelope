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

      const outputScript = await message.toScript();
      expect(outputScript.toASM()).to.eql('0 OP_RETURN 00 080012068a66a07bf8e91a0b7289a96a7cbf9688288e98 68656c6c6f20776f726c6432');
      expect(index.Envelope.fromScript(outputScript)).to.eql(message);

   });

   it('should be valid minimal envelope with metanet node', async () => {
     /*

     */

   });

});