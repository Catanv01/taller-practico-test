import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { ShipmentsService } from "./shipments.service";

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const rulesServiceMock = {
    ensureCanBeDispatched: jest.fn(),
  };

    beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: getRepositoryToken(ShipmentEntity), useValue: repositoryMock },
        { provide: ShipmentRulesService, useValue: rulesServiceMock },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('returns all shipments', async () => {
    // Arrange
    const shipments = [
      { id: 1, trackingCode: 'SHIP-1', destination: 'Cali' },
      { id: 2, trackingCode: 'SHIP-2', destination: 'Bogotá' },
    ] as ShipmentEntity[];
    repositoryMock.find.mockResolvedValue(shipments);

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toEqual(shipments);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  it('returns a shipment when the id exists', async () => {
    // Arrange
    const shipment = { id: 7, trackingCode: 'SHIP-7' } as ShipmentEntity;
    repositoryMock.findOneBy.mockResolvedValue(shipment);

    // Act
    const result = await service.findOne(7);

    // Assert
    expect(result).toEqual(shipment);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
  });

  it('throws NotFoundException when the id does not exist', async () => {
    // Arrange
    repositoryMock.findOneBy.mockResolvedValue(null);

    // Act
    const promise = service.findOne(999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
  });
  
