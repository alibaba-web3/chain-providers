import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';

@Injectable()
export class EthereumBlocksService {
  constructor(
    @InjectRepository(EthereumBlocks)
    private blocksRepository: Repository<EthereumBlocks>,
  ) {}

  async insertOne(block: EthereumBlocks) {
    this.blocksRepository.insert(block);
  }
}
