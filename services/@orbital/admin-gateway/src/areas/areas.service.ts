import { Injectable } from "@nestjs/common";
import { WorldMicroservice } from "../world/world.microservice";

@Injectable()
export class AreasService {
  constructor(private readonly worldService: WorldMicroservice) {}

  async getAll() {
    return this.worldService.getAllAreas();
  }

  async getById(id: string) {
    return this.worldService.getArea(id);
  }

  async create(body: any) {
    return this.worldService.createArea(body);
  }

  async update(id: string, body: any) {
    return this.worldService.updateArea(id, body);
  }

  async delete(id: string) {
    return this.worldService.deleteArea(id);
  }
}
