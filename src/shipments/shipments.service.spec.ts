import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { ShipmentsService } from './shipments.service';
import { describe, it, expect, jest } from "@jest/globals";

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const rulesService = {
    ensureCanBeDispatched: jest.fn(),
  };
  