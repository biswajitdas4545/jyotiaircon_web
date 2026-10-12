import React, { useEffect, useState } from 'react';
import './Customer.css';
import Header from '../header';
import CustomerService from '../../../services/customerService';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await CustomerService.getAll({
          page: currentPage,
          size: pageSize,
          signal: controller.signal,
        });
        const rows = Array.isArray(result)
          ? result
          : Array.isArray(result?.customers)
            ? result.customers
            : null;

        if (!rows) {
          throw new Error('The customer API returned an invalid response.');
        }

        setCustomers(rows);
        setTotalRecords(Number(result?.total_count ?? result?.total ?? rows.length));
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          console.error('Error fetching customers:', fetchError);
          setCustomers([]);
          setTotalRecords(0);
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load customers.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [currentPage, pageSize]);

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const showValue = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value);

  return (
    <div className="customer-container">
      <Header />

      <main className="customer-content">
        <section className="table-controls d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h1 className="h4 mb-0">Customers</h1>
          <label className="d-flex align-items-center gap-2 mb-0">
            <span>Rows per page</span>
            <select
              className="form-select"
              value={pageSize}
              onChange={handlePageSizeChange}
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="table-section">
          <div className="table-wrapper">
            {error && <div className="alert alert-danger m-3" role="alert">{error}</div>}

            <table className="table table-hover table-bordered">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Customer ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Address</th>
                  <th scope="col">Purchase Date</th>
                  <th scope="col">AC Model</th>
                  <th scope="col">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">Loading customers...</td>
                  </tr>
                ) : customers.length > 0 ? (
                  customers.map((customer, index) => (
                    <tr key={customer.customer_id ?? index}>
                      <td>{showValue(customer.customer_id)}</td>
                      <td>{showValue(customer.full_name)}</td>
                      <td>{showValue(customer.email)}</td>
                      <td>{showValue(customer.phone)}</td>
                      <td>{showValue(customer.address)}</td>
                      <td>{showValue(customer.purchase_date)}</td>
                      <td>{showValue(customer.ac_model)}</td>
                      <td>{showValue(customer.total_price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">No customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-section">
            <div className="pagination-info">
              Showing {customers.length ? (currentPage - 1) * pageSize + 1 : 0}
              {' '}to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} customers
            </div>
            {totalPages > 1 && (
              <nav aria-label="Customer pagination">
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </button>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link">{currentPage} / {totalPages}</span>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Customer;
