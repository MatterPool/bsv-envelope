
import { MessageEnvelope } from './message-envelope';

try {
  if (window) {
    window['bsvenvelope'] = {
      Envelope: MessageEnvelope,
    };
  }
}
catch (ex) {
  // Window is not defined, must be running in windowless env...
}

export var Envelope = MessageEnvelope;
