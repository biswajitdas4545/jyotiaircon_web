import React, { useEffect, useState } from 'react';
import Footer from './Footer';
import Header from './header';
import Nabvar from './navbar';

const EMPLOYEE_API_URL = 'https://jyotiairconditioning.in/websercice/api/employes';
const PAGE_SIZE = 10;

const buildApiHeaders = (extra = {}) => {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };
};

const formatEmployeeName = (record = {}) => {
  const first = record.first_name || record.firstName || '';
  const last = record.last_name || record.lastName || '';
  const fallback = record.name || record.emp_name || record.employee_name || record.employeeName || '';
  return (fallback || [first, last].filter(Boolean).join(' ') || 'N/A').trim();
};

const normalizeEmployees = (payload) => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.employees)
        ? payload.data.employees
        : Array.isArray(payload?.employees)
          ? payload.employees
          : Array.isArray(payload?.data?.data)
            ? payload.data.data
            : [];

  return rows.map((record, index) => {
    const employee = record && typeof record === 'object' ? record : {};
    const employeeId = employee.employee_id || employee.employeeId || employee.id || employee.emp_id || index + 1;

    return {
      id: employeeId,
      name: formatEmployeeName(employee),
      email: employee.email || employee.email_address || 'N/A',
      phone: employee.phone || employee.mobile || employee.mobile_number || 'N/A',
      designation: employee.designation || employee.position || employee.job_title || 'N/A',
      department: employee.department || employee.dept || employee.division || 'N/A',
      status: employee.status || 'Active',
      created_at: employee.created_at || employee.createdAt || employee.join_date || 'N/A',
    };
  });
};

function EmployeeWorking() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [newEmployeeData, setNewEmployeeData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
  });

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });

      const response = await fetch(`${EMPLOYEE_API_URL}?${query.toString()}`, {
        method: 'GET',
        headers: buildApiHeaders(),
      });

      const responseText = await response.text();
      let payload = null;
      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(`Employee API returned an invalid response (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(payload?.message || `Employee request failed (HTTP ${response.status}).`);
      }

      const nextEmployees = normalizeEmployees(payload);
      const total = Number(payload?.total_count ?? payload?.total ?? payload?.data?.total_count ?? payload?.data?.total ?? nextEmployees.length ?? 0);

      setEmployees(nextEmployees);
      setTotalRecords(total);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
      setTotalRecords(0);
      setError(err instanceof Error ? err.message : 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setNewEmployeeData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setNewEmployeeData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designation: '',
    });
    setSubmitError('');
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError('');

    try {
      const payload = {
        first_name: newEmployeeData.first_name.trim(),
        last_name: newEmployeeData.last_name.trim(),
        email: newEmployeeData.email.trim(),
        phone: newEmployeeData.phone.trim(),
        designation: newEmployeeData.designation.trim(),
      };

      if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone || !payload.designation) {
        throw new Error('Please fill in all employee fields before saving.');
      }

      const response = await fetch(EMPLOYEE_API_URL, {
        method: 'POST',
        headers: buildApiHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result = null;
      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(`Employee creation failed (HTTP ${response.status}).`);
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || `Employee creation failed (HTTP ${response.status}).`);
      }

      setShowAddModal(false);
      resetForm();
      setCurrentPage(1);
      await fetchEmployees(1);
    } catch (err) {
      console.error('Error creating employee:', err);
      setSubmitError(err instanceof Error ? err.message : 'Unable to create employee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <Nabvar />
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">Employee Management</h4>
            <small className="text-muted">Showing {employees.length} of {totalRecords} records</small>
          </div>
          <button type="button" className="btn btn-success" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-user-plus me-2"></i>
            Add Employee
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length ? (
                  employees.map((employee, index) => (
                    <tr key={`${employee.id}-${index}`}>
                      <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.phone}</td>
                      <td>{employee.designation}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success">{employee.status}</span>
                      </td>
                      <td>{employee.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            Page <strong>{currentPage}</strong> / {totalPages}
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Employee</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => { setShowAddModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleCreateEmployee}>
                <div className="modal-body">
                  {submitError && <div className="alert alert-danger">{submitError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input className="form-control" name="first_name" value={newEmployeeData.first_name} onChange={handleFieldChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input className="form-control" name="last_name" value={newEmployeeData.last_name} onChange={handleFieldChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={newEmployeeData.email} onChange={handleFieldChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input className="form-control" name="phone" value={newEmployeeData.phone} onChange={handleFieldChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Designation</label>
                      <input className="form-control" name="designation" value={newEmployeeData.designation} onChange={handleFieldChange} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default EmployeeWorking;
