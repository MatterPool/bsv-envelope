/**
Open BSV License
Copyright (c) 2020 MatterPool Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

1 - The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
2 - The Software, and any software that is derived from the Software or parts thereof,
can only be used on the Bitcoin SV blockchains. The Bitcoin SV blockchains are defined,
for purposes of this license, as the Bitcoin blockchain containing block height #556767
with the hash "000000000000000001d956714215d96ffc00e0afda4cd0a96c96f8d802b1662b" and
the test blockchains that are supported by the un-modified Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
import * as bsv from 'bsv';
import * as protobuf from 'protobufjs';
const messagesDefn = require('../messages.protobuf.bundle.json');
const root = protobuf.Root.fromJSON(messagesDefn);
import * as Long from 'long';
import { EncryptedPayloadEnvelope } from './encrypted-payload-envelope';

/**
 * Tokenized.com Envelope Protocol Envelope
 * https://github.com/tokenized/envelope
 */
export class MessageEnvelope {
    private metanet_;                           // Not used for now until.
    private payloadIdentifier_;                 // File name or payload identifier. Can be file sha256 hash or txid.
    private payloadType_;                       // Mime type of the payload
    private payload_;                           // Optional non-encrypted payload
    static envelopeProtocolIdentifier = 'bd';   // Magic number to signal Envelope Protocol (hex)
    static envelopeVersion = '00';              // Version 0 (hex)
    private encryptedPayloads_: Array<EncryptedPayloadEnvelope> = [];
    /**
     *
     * @param payloadProtocol_ Default File system 'F' usage
     * @param payloadVersion_ Version of the payload
     */
    private constructor(
        private payloadProtocol_ = 'F',
        private payloadVersion_ = 0,
    ) {
    }

    getEnvelopeVersion() {
        return MessageEnvelope.envelopeVersion;
    }

    getPayloadProtocol() {
        return this.payloadProtocol_;
    }

    setPayloadProtocol(v) {
        this.payloadProtocol_ = v;
    }

    setPayloadVersion(v) {
        this.payloadVersion_ = v;
    }

    getPayloadVersion() {
        return this.payloadVersion_;
    }

    setPayloadIdentifier(s: string) {
        this.payloadIdentifier_ = s;
    }

    getPayloadIdentifier() {
        return this.payloadIdentifier_;
    }

    setPayloadType(s: string) {
        this.payloadType_ = s;
    }

    getPayloadType(): string {
        return this.payloadType_;
    }

    setPayload(b: Buffer) {
        this.payload_ = b;
    }

    getPayload(): Buffer {
        return this.payload_;
    }

    getEncryptedPayloadCount() {
        return -1;
    }

    addEncryptedPayload(
        payload: Buffer,
        tx: bsv.Transaction,
        senderIndex: number,
        senderPrivateKey: bsv.PrivateKey,
        receivers: bsv.PublicKey) {
            /*
        encryptedPayload, err := NewEncryptedPayload(payload, tx, senderIndex, sender,
            receivers)
        if err != nil {
            return err
        }
        m.encryptedPayloads = append(m.encryptedPayloads, encryptedPayload)*/
        return null
    }

    setEncryptedPayloads(v) {
       return this.encryptedPayloads_ = v;
    }

    getEncryptedPayload(index: number): EncryptedPayloadEnvelope {
        return this.encryptedPayloads_[index];
    }

    getEncryptedPayloads(): EncryptedPayloadEnvelope[] {
        return this.encryptedPayloads_;
    }

    toScript(): bsv.Script {
        const out = new bsv.Script();
        out.add(bsv.Opcode.OP_FALSE);
        out.add(bsv.Opcode.OP_RETURN);
        // Protocol and Envelope Protocol Version
        out.add(Buffer.from(MessageEnvelope.envelopeProtocolIdentifier + MessageEnvelope.envelopeVersion, 'hex'));
        if (!this.payloadProtocol_ || !this.payloadProtocol_.length) {
            throw new Error('invalid payload protocol');
        }
        out.add(Buffer.from(this.payloadProtocol_, 'utf8'));
        let message;
        const Envelope = root.lookupType("protobuf.Envelope");
        message = Envelope.create({
            Version: this.payloadVersion_,
            Type: Buffer.from(this.payloadType_, 'utf8'),
            Identifier: Buffer.from(this.payloadIdentifier_, 'utf8')
            // EncryptedPayloads: // added below
        }); // or use .fromObject if conversion is necessary

        /*
        if (this.metanet_) {
            message.MetaNet = {
                Index: this.metanet_.index,
                Parent: this.metanet_.parent
        };
        */
        const EncryptedPayload = root.lookupType("protobuf.EncryptedPayload");
        const Receiver = root.lookupType("protobuf.Receiver");
        const protoBufEnvelopeEncryptedPayloads: any = [];
        for (const encryptedPayload of this.encryptedPayloads_) {
            const protobufReceivers: any = [];
            for (const receiver of encryptedPayload.receivers) {
                const protobufReceiver = Receiver.create({
                    Index: receiver.index,
                    EncryptedKey: receiver.encryptedKey
                });
                protobufReceivers.push(protobufReceiver);
            }
            const protobufEncryptedPayload = EncryptedPayload.create({
                Sender: encryptedPayload.sender,
                Receivers: protobufReceivers,
                Payload: encryptedPayload.payload,
            });

            protoBufEnvelopeEncryptedPayloads.push(protobufEncryptedPayload);
        }
        message.EncryptedPayloads = protoBufEnvelopeEncryptedPayloads;
        const encodedProtobufMessage = Envelope.encode(message).finish();
        out.add(encodedProtobufMessage);

        if (this.payload_) {
            out.add(this.payload_);
        }
        return out;
    }

    static fromScript(scriptStr: bsv.Script): MessageEnvelope {
        const Envelope = root.lookupType("protobuf.Envelope");
        let script = new bsv.Script(scriptStr);

        if (script.chunks[0].opcodenum !== bsv.Opcode.OP_FALSE) {
            throw new Error('Invalid script: OP_FALSE not found');
        }
        if (script.chunks[1].opcodenum !== bsv.Opcode.OP_RETURN) {
            throw new Error('Invalid script: OP_RETURN not found');
        }
        if (script.chunks[2].buf.toString('hex') !== (MessageEnvelope.envelopeProtocolIdentifier + MessageEnvelope.envelopeVersion)) {
            throw new Error('Invalid script: Version not found');
        }
        const pp = script.chunks[3].buf.toString('utf8');
        switch (pp) {
            case 'F':
            // File system usage determined
            break;
            default:
            console.log('Warning: unknown protocol usage type', pp);
        }
        const message = new MessageEnvelope(pp);
        const envelope = Envelope.decode(script.chunks[4].buf);
        message.setPayloadVersion(Long.fromValue(envelope['Version']).toNumber());
        message.setPayloadType(envelope['Type'].toString('utf8'));
        message.setPayloadIdentifier(envelope['Identifier'].toString('utf8'));
        message.setEncryptedPayloads(envelope['EncryptedPayloads']);

        if (script.chunks[5] && script.chunks[5].buf) {
            message.setPayload(script.chunks[5].buf);
        }
        return message;
    }

    static fromTransaction(tx: bsv.Transaction): MessageEnvelope[] {
        const envelopes: MessageEnvelope[] = [];
        for (const txout of tx.outputs) {
            try {
                const s = MessageEnvelope.fromScript(txout.script);
                if (s) {
                    envelopes.push(s)
                }
            } catch (ex) {
                // Not valid output for MessageEnvelope, skip it...
            }
        }
        return envelopes;
    }

    static fromRawTransaction(rawtx: string): MessageEnvelope[] {
        return MessageEnvelope.fromTransaction(new bsv.Transaction(rawtx));
    }
}