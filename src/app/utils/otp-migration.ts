/**
 * Lightweight Google Authenticator Migration Protocol (otpauth-migration://) parser.
 * This implementation avoids external protobuf dependencies by manually decoding
 * the required fields from the binary payload.
 *
 * MigrationPayload structure (Protobuf):
 * 1: repeated OtpParameters otp_parameters
 * 2: int32 version
 * 3: int32 batch_size
 * 4: int32 batch_index
 * 5: int32 batch_id
 *
 * OtpParameters structure (Protobuf):
 * 1: bytes secret
 * 2: string name
 * 3: string issuer
 * 4: Algorithm algorithm
 * 5: DigitCount digits
 * 6: OtpType type
 * 7: int64 counter
 */

export interface MigrationAccount {
  secret: Uint8Array;
  name: string;
  issuer: string;
  algorithm: string;
  digits: number;
  type: 'totp' | 'hotp';
  counter: number;
}

export function parseMigrationUrl(url: string): MigrationAccount[] {
  const uri = new URL(url);
  if (uri.protocol !== 'otpauth-migration:') {
    throw new Error('Invalid protocol');
  }

  const data = uri.searchParams.get('data');
  if (!data) {
    throw new Error('Missing data parameter');
  }

  const binary = base64ToUint8Array(data);
  return decodeMigrationPayload(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  // Handle URL-safe base64 if needed (though Google usually uses standard)
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function decodeMigrationPayload(data: Uint8Array): MigrationAccount[] {
  const accounts: MigrationAccount[] = [];
  let pos = 0;

  while (pos < data.length) {
    const { tag, type } = readTag(data, pos);
    pos = tag.next;

    if (tag.value === 1 && type === 2) {
      // otp_parameters (Length-delimited)
      const { value: length, next } = readVarint(data, pos);
      const len = Number(length);
      pos = next;
      const subData = data.slice(pos, pos + len);
      accounts.push(decodeOtpParameters(subData));
      pos += len;
    } else {
      // Skip unknown tags
      pos = skipField(data, pos, type);
    }
  }

  return accounts;
}

function decodeOtpParameters(data: Uint8Array): MigrationAccount {
  const account: Partial<MigrationAccount> = {
    name: '',
    issuer: '',
    algorithm: 'SHA1',
    digits: 6,
    type: 'totp',
    counter: 0,
  };

  let pos = 0;
  while (pos < data.length) {
    const { tag, type } = readTag(data, pos);
    pos = tag.next;

    let consumed = false;
    switch (tag.value) {
      case 1: // secret (bytes)
        if (type === 2) {
          const { value: length, next } = readVarint(data, pos);
          const len = Number(length);
          pos = next;
          account.secret = data.slice(pos, pos + len);
          pos += len;
          consumed = true;
        }
        break;
      case 2: // name (string)
        if (type === 2) {
          const { value: length, next } = readVarint(data, pos);
          const len = Number(length);
          pos = next;
          account.name = new TextDecoder().decode(data.slice(pos, pos + len));
          pos += len;
          consumed = true;
        }
        break;
      case 3: // issuer (string)
        if (type === 2) {
          const { value: length, next } = readVarint(data, pos);
          const len = Number(length);
          pos = next;
          account.issuer = new TextDecoder().decode(data.slice(pos, pos + len));
          pos += len;
          consumed = true;
        }
        break;
      case 4: // algorithm (enum)
        if (type === 0) {
          const { value, next } = readVarint(data, pos);
          pos = next;
          account.algorithm = decodeAlgorithm(Number(value));
          consumed = true;
        }
        break;
      case 5: // digits (enum)
        if (type === 0) {
          const { value, next } = readVarint(data, pos);
          pos = next;
          account.digits = decodeDigits(Number(value));
          consumed = true;
        }
        break;
      case 6: // type (enum)
        if (type === 0) {
          const { value, next } = readVarint(data, pos);
          pos = next;
          account.type = value === 1n ? 'hotp' : 'totp';
          consumed = true;
        }
        break;
      case 7: // counter (int64)
        if (type === 0) {
          const { value, next } = readVarint(data, pos);
          pos = next;
          account.counter = Number(value);
          consumed = true;
        }
        break;
    }

    if (!consumed) {
      pos = skipField(data, pos, type);
    }
  }

  return account as MigrationAccount;
}

function readVarint(data: Uint8Array, pos: number): { value: bigint; next: number } {
  let value = 0n;
  let shift = 0n;
  while (pos < data.length) {
    const b = data[pos++];
    value |= BigInt(b & 0x7f) << shift;
    if (!(b & 0x80)) break;
    shift += 7n;
  }
  return { value, next: pos };
}

function readTag(
  data: Uint8Array,
  pos: number,
): { tag: { value: number; next: number }; type: number } {
  const { value, next } = readVarint(data, pos);
  return {
    tag: { value: Number(value >> 3n), next },
    type: Number(value & 0x07n),
  };
}

function skipField(data: Uint8Array, pos: number, type: number): number {
  switch (type) {
    case 0: // Varint
      return readVarint(data, pos).next;
    case 1: // 64-bit
      return pos + 8;
    case 2: {
      // Length-delimited
      const { value: length, next } = readVarint(data, pos);
      return next + Number(length);
    }
    case 3: // Start group
      while (true) {
        if (pos >= data.length) break;
        const { tag: subTag, type: subType } = readTag(data, pos);
        pos = subTag.next;
        if (subType === 4) break;
        pos = skipField(data, pos, subType);
      }
      return pos;
    case 4: // End group
      return pos;
    case 5: // 32-bit
      return pos + 4;
    default:
      throw new Error(`Unsupported wire type: ${type}`);
  }
}

function decodeAlgorithm(val: number): string {
  switch (val) {
    case 1:
      return 'SHA1';
    case 2:
      return 'SHA256';
    case 3:
      return 'SHA512';
    case 4:
      return 'MD5';
    default:
      return 'SHA1';
  }
}

function decodeDigits(val: number): number {
  switch (val) {
    case 1:
      return 6;
    case 2:
      return 8;
    default:
      return 6;
  }
}
