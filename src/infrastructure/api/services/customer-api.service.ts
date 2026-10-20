import type { AxiosInstance } from 'axios';
import { CustomerMapper } from '@/application/mappers/customer.mapper';
import { CustomerLookupNotFoundError } from '@/core/errors/customer.errors';
import { DomainError } from '@/core/errors/domain.error';
import type { CustomerLookupResult, ICustomerLookupPort } from '@/core/ports/customer-lookup.port';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { unwrapApiData } from '@/infrastructure/api/client/unwrap-response';
import type { CustomerLookupResponseDto } from '@/infrastructure/api/dto/customer.dto';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';

/**
 * Online lookup by identification. The API searches its own customers first and then the
 * billing system, importing the match. Needs a connection: everything else about customers
 * travels through the sync.
 */
export class CustomerApiService implements ICustomerLookupPort {
  constructor(private readonly client: AxiosInstance = apiClient) {}

  public async lookupByIdentification(identification: string): Promise<CustomerLookupResult> {
    try {
      const response = await this.client.get<unknown>(API_ENDPOINTS.customers.lookup, {
        params: { identification },
      });
      const dto = unwrapApiData<CustomerLookupResponseDto>(response.data);
      return {
        customer: CustomerMapper.toDomain(dto),
        source: dto.lookupSource === 'BILLING' ? 'BILLING' : 'LOCAL',
      };
    } catch (error) {
      if (error instanceof DomainError && error.statusCode === 404) {
        throw new CustomerLookupNotFoundError();
      }
      throw error;
    }
  }
}

export const customerApiService = new CustomerApiService();
