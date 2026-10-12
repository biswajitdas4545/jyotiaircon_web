const CUSTOMER_API_URL = 'https://jyotiairconditioning.in/websercice/api/customer';

class CustomerService {
  static async getAll({ page = 1, size = 10, signal } = {}) {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    const response = await fetch(`${CUSTOMER_API_URL}?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    const responseText = await response.text();
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(`Customer API returned an invalid response (HTTP ${response.status}).`);
    }

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || `Customer request failed (HTTP ${response.status}).`);
    }

    return result?.data ?? result;
  }
}

export default CustomerService;
