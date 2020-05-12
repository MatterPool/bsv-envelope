
export interface EncryptedPayloadEnvelope {
    sender: string,     // 0 or more encrypted payloads, with their senders and receivers
    receivers: Array<{
        index: string,
        encryptedKey: string
    }>,
    payload: any     // Enrypted payload blob. Any buffer or data or even sub-protocol type.
};