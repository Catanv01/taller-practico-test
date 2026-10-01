import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ShipmentsService } from "./shipments.service";
import { FindOptionsWhere } from 'typeorm';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    find: jest.fn<() => Promise<ShipmentEntity[]>>(),
    findOneBy: jest.fn<
      (where: FindOptionsWhere<ShipmentEntity>) => Promise<ShipmentEntity | null>
    >(),
    create: jest.fn<(data: Partial<ShipmentEntity>) => ShipmentEntity>(),
    save: jest.fn<(entity: ShipmentEntity) => Promise<ShipmentEntity>>(),
  };

  const rulesServiceMock = {
    ensureCanBeDispatched: jest.fn<(shipment: ShipmentEntity) => void>(),
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

    it('creates and saves a shipment', async () => {
    // Arrange
    const data = { trackingCode: 'SHIP-100', destination: 'Cali' };
    const built = { ...data, status: ShipmentStatus.CREATED } as ShipmentEntity;
    const saved = { ...built, id: 1 } as ShipmentEntity;
    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    // Act
    const result = await service.create(data);

    // Assert
    expect(repositoryMock.create).toHaveBeenCalledWith({
      ...data,
      status: ShipmentStatus.CREATED,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual(saved);
  });

  it('dispatches and saves a valid shipment', async () => {
    // Arrange
    const shipment = { id: 5, status: ShipmentStatus.CREATED } as ShipmentEntity;
    const updated = { ...shipment, status: ShipmentStatus.DISPATCHED } as ShipmentEntity;
    repositoryMock.findOneBy.mockResolvedValue(shipment);
    repositoryMock.save.mockResolvedValue(updated);
    rulesServiceMock.ensureCanBeDispatched.mockReturnValue(undefined);

    // Act
    const result = await service.dispatch(5);

    // Assert
    expect(rulesServiceMock.ensureCanBeDispatched).toHaveBeenCalledWith(shipment);
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ShipmentStatus.DISPATCHED }),
    );
    expect(result).toEqual(updated);
  });
})
