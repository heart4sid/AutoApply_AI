// ============================================================
// AutoApply AI — Aggregator Service
// ============================================================

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AggregatorConnectionEntity } from './entities/aggregator-connection.entity';
import { CredentialVaultService } from './credential-vault.service';
import { MockAdapter } from './adapters/mock.adapter';
import { IAggregatorAdapter } from './adapters/adapter.interface';
import { AGGREGATORS } from '@autoapply/shared';

@Injectable()
export class AggregatorService {
  private readonly adapters: Map<string, IAggregatorAdapter> = new Map();

  constructor(
    @InjectRepository(AggregatorConnectionEntity)
    private readonly connectionRepo: Repository<AggregatorConnectionEntity>,
    private readonly vaultService: CredentialVaultService,
  ) {
    // Instantiate mock adapters for all registry items
    AGGREGATORS.forEach(agg => {
      this.adapters.set(agg.id, new MockAdapter(agg.id, agg.name));
    });
  }

  getAdapter(aggregatorId: string): IAggregatorAdapter {
    const adapter = this.adapters.get(aggregatorId);
    if (!adapter) {
      throw new NotFoundException(`Adapter not found for ID: ${aggregatorId}`);
    }
    return adapter;
  }

  // ── Get User Connections ──
  async getConnections(userId: string): Promise<any[]> {
    const connections = await this.connectionRepo.find({ where: { userId } });
    
    // Map with static registry info
    return connections.map(conn => {
      const registryInfo = AGGREGATORS.find(a => a.id === conn.aggregatorId);
      return {
        ...conn,
        aggregator: registryInfo,
      };
    });
  }

  // ── Connect Aggregator ──
  async connect(userId: string, body: any): Promise<any> {
    const { aggregatorId, username, password, config } = body;

    const registryInfo = AGGREGATORS.find(a => a.id === aggregatorId);
    if (!registryInfo) {
      throw new NotFoundException('Aggregator platform not found in registry');
    }

    // Attempt login validation
    const adapter = this.getAdapter(aggregatorId);
    const isValid = await adapter.login({ username, password });
    
    if (!isValid) {
      throw new BadRequestException('Connection validation failed: Invalid credentials');
    }

    // Encrypt credentials
    const encryption = this.vaultService.encrypt(password);

    // Save connection details
    let connection = await this.connectionRepo.findOne({ where: { userId, aggregatorId } });
    if (!connection) {
      connection = this.connectionRepo.create({ userId, aggregatorId });
    }

    connection.status = 'connected';
    connection.encryptedCredentials = encryption.ciphertext;
    connection.encryptionIv = encryption.iv;
    connection.encryptionTag = encryption.tag;
    connection.config = config || { dailyLimit: 25, searchQueries: ['Node.js'], locationFilters: [] };
    connection.lastValidatedAt = new Date();
    connection.errorMessage = null;

    const saved = await this.connectionRepo.save(connection);

    return {
      ...saved,
      aggregator: registryInfo,
    };
  }

  // ── Disconnect ──
  async disconnect(userId: string, id: string): Promise<void> {
    const connection = await this.connectionRepo.findOne({ where: { id, userId } });
    if (!connection) {
      throw new NotFoundException('Aggregator connection not found');
    }
    await this.connectionRepo.remove(connection);
  }
}
