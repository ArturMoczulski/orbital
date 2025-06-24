import { Injectable } from "@nestjs/common";

@Injectable()
export class AreasService {
  getAll(): any[] {
    // TODO: Proxy to Area microservice
    return [];
  }

  getById(id: string): any {
    // TODO: Proxy to Area microservice
    return { id };
  }

  create(body: any): any {
    // TODO: Proxy to Area microservice
    return body;
  }

  update(id: string, body: any): any {
    // TODO: Proxy to Area microservice
    return { id, ...body };
  }

  delete(id: string): any {
    // TODO: Proxy to Area microservice
    return { deletedId: id };
  }
}
