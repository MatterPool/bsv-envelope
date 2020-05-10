import * as bsv from 'bsv';
import * as protobuf from 'protobufjs';

export class MessageEnvelope {
    private payloadIdentifier_;
    private payloadType_;
    private payload_;
    private envelopeVersion_ = '00';
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
        private payloadVersion_ = '00',
    ) {
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

    async toScript(): bsv.Script {
        const out = new bsv.Script();
        out.add(bsv.Opcode.OP_FALSE);
        out.add(bsv.Opcode.OP_RETURN);
        // Envelope Protocol Version
        out.add(Buffer.from(this.envelopeVersion_, 'hex'));

        if (!this.payloadProtocol_ || !this.payloadProtocol_.length) {
            throw new Error('invalid payload protocol');
        }

        out.add(Buffer.from(this.payloadProtocol_, 'hex'));
        let message;
        return await protobuf.load("messages.proto")
        .then((root) => {
            const Envelope = root.lookupType("protobuf.Envelope");
            message = Envelope.create({
                Version: this.payloadVersion_,
                Type: this.payloadType_,
                Identifier: this.payloadIdentifier_,
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
            out.add(Envelope.encode(message).finish());

            if (this.payload_) {
                out.add(this.payload_);
            }
            return out;
        });
    }

    static fromScript(script: string): MessageEnvelope {
        return new MessageEnvelope();
    }
}