import * as bsv from 'bsv';
import * as protobuf from 'protobufjs';
const messagesDefn = require('../messages.protobuf.bundle.json');
const root = protobuf.Root.fromJSON(messagesDefn);
import * as Long from 'long';

export class MessageEnvelope {
    private payloadIdentifier_;
    private payloadType_;
    private payload_;
    static envelopeProtocolIdentifier = 'bd';
    static envelopeVersion = '00';
    private encryptedPayloads_: Array<{
        sender: string,
        receivers: Array<{
            index: string,
            encryptedKey: string
        }>,
        payload: any
    }> = [];

    private metanet_?: {
        index?: any,
        parent?: any;
    } = undefined;
    private constructor(
        private payloadProtocol_ = 'F',
        private payloadVersion_ = 0,
    ) {
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
            Identifier: Buffer.from(this.payloadIdentifier_, 'utf8') // this.payloadIdentifier_,
            // EncryptedPayloads: // added below
        }); // or use .fromObject if conversion is necessary

        if (this.metanet_) {
            message.MetaNet = {
                Index: this.metanet_.index,
                Parent: this.metanet_.parent
            };
        }
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

        //console.log('encodedProtobufMessage', encodedProtobufMessage);
        // const d = Envelope.decode(encodedProtobufMessage);
        // console.log('dddd', d);

        if (this.payload_) {
            out.add(this.payload_);
        }
        return out;
    }

    static fromScript(scriptStr: bsv.Script): MessageEnvelope {
        const Envelope = root.lookupType("protobuf.Envelope");
        let script = new bsv.Script(scriptStr);
        const message = new MessageEnvelope();

        console.log('script', script.chunks);
        if (script.chunks[0].opcodenum !== bsv.Opcode.OP_FALSE) {
            throw new Error('Invalid script: OP_FALSE not found');
        }
        if (script.chunks[1].opcodenum !== bsv.Opcode.OP_RETURN) {
            throw new Error('Invalid script: OP_RETURN not found');
        }
        if (script.chunks[2].buf.toString('hex') !== (MessageEnvelope.envelopeProtocolIdentifier + MessageEnvelope.envelopeVersion)) {
            throw new Error('Invalid script: Version not found');
        }
        if (script.chunks[3].buf.toString('utf8') !== 'F') {
            throw new Error('Invalid script: File system F not found');
        }

        const envelope = Envelope.decode(script.chunks[4].buf);
        message.setPayloadVersion(Long.fromValue(envelope['Version']).toNumber());
        message.setPayloadType(envelope['Type'].toString('utf8'));
        message.setPayloadIdentifier(envelope['Identifier'].toString('utf8'));

        if (script.chunks[5] && script.chunks[5].buf) {
            message.setPayload(script.chunks[5].buf);
        }

        /*


// Deserialize reads the Message from an OP_RETURN script.
func Deserialize(buf *bytes.Reader) (*Message, error) {
	var result Message

	// Protocol ID
	var opCode byte
	var err error
	opCode, result.payloadProtocol, err = bitcoin.ParsePushDataScript(buf)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to parse protocol ID")
	}
	if len(result.payloadProtocol) == 0 && opCode != bitcoin.OP_FALSE { // Non push data op code
		return nil, ErrNotEnvelope
	}

	// Envelope
	_, envelopeData, err := bitcoin.ParsePushDataScript(buf)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to read MetaNet data")
	}

	var envelope protobuf.Envelope
	if len(envelopeData) != 0 {
		if err = proto.Unmarshal(envelopeData, &envelope); err != nil {
			return nil, errors.Wrap(err, "Failed envelope protobuf unmarshaling")
		}
	}

	result.payloadVersion = envelope.GetVersion()
	result.payloadType = envelope.GetType()
	result.payloadIdentifier = envelope.GetIdentifier()

	// MetaNet
	pbMetaNet := envelope.GetMetaNet()
	if pbMetaNet != nil {
		result.metaNet = &MetaNet{
			index:  pbMetaNet.GetIndex(),
			parent: pbMetaNet.GetParent(),
		}
	}

	// Encrypted payloads
	pbEncryptedPayloads := envelope.GetEncryptedPayloads()
	result.encryptedPayloads = make([]*EncryptedPayload, 0, len(pbEncryptedPayloads))
	for _, pbEncryptedPayload := range pbEncryptedPayloads {
		var encryptedPayload EncryptedPayload

		// Sender
		encryptedPayload.sender = pbEncryptedPayload.GetSender()

		// Receivers
		pbReceivers := pbEncryptedPayload.GetReceivers()
		encryptedPayload.receivers = make([]*Receiver, 0, len(pbReceivers))
		for _, pbReceiver := range pbReceivers {
			encryptedPayload.receivers = append(encryptedPayload.receivers, &Receiver{
				index:        pbReceiver.GetIndex(),
				encryptedKey: pbReceiver.GetEncryptedKey(),
			})
		}

		// Payload
		encryptedPayload.payload = pbEncryptedPayload.GetPayload()

		result.encryptedPayloads = append(result.encryptedPayloads, &encryptedPayload)
	}

	// Public payload
	_, result.payload, err = bitcoin.ParsePushDataScript(buf)
	if err != nil {
		return nil, errors.Wrap(err, "Failed to read payload")
	}

	return &result, nil
}
*/
        console.log('message, message)', message);
        return message;
    }
}