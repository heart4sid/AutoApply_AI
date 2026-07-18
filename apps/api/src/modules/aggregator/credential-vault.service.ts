// ============================================================
// AutoApply AI — Credential Encryption Utility
// ============================================================

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CredentialVaultService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const rawKey = this.config.get<string>(
      'CREDENTIAL_ENCRYPTION_KEY',
      'dev-encryption-key-32-chars-here!', // fallback 32-bytes
    );
    // Pad or truncate to ensure exactly 32 bytes
    this.encryptionKey = Buffer.concat([Buffer.from(rawKey), Buffer.alloc(32)], 32);
  }

  encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag,
    };
  }

  decrypt(ciphertext: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  }
}
