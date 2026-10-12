import React, { useState, useEffect, useCallback } from 'react';
import Footer from '../Footer';
import Header from '../header';
import Nabvar from '../navbar';
import './Employee.css';
import EmployeeService from '../../../services/employeeService';

const EMPLOYEE_API_URL = 'https://jyotiairconditioning.in/websercice/api/employes';

async function requestEmployeeApi(path, options = {}) {
    const response = await fetch(`${EMPLOYEE_API_URL}${path}`, {
        ...options,
        headers: {
            'Accept': 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });
    const responseText = await response.text();
    let result;

    try {
        result = responseText ? JSON.parse(responseText) : null;
    } catch {
        throw new Error(`Employee API returned an unexpected response (HTTP ${response.status}).`);
    }

    if (!response.ok || result?.success === false) {
        const errorCode = result?.data?.error_code;
        const message = result?.message || `Employee request failed (HTTP ${response.status}).`;
        throw new Error(errorCode ? `${message} (code: ${errorCode})` : message);
    }

    return result?.data ?? result;
}

function Employee() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [addEmployeeError, setAddEmployeeError] = useState('');
    const [savingNewEmployee, setSavingNewEmployee] = useState(false);
    const [employeeDetailsError, setEmployeeDetailsError] = useState('');
    const [editEmployeeError, setEditEmployeeError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [showViewEmployeeModal, setShowViewEmployeeModal] = useState(false);
    const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
    const [showDeleteEmployeeModal, setShowDeleteEmployeeModal] = useState(false);
    const [viewEmployeeData, setViewEmployeeData] = useState(null);
    const [editEmployeeData, setEditEmployeeData] = useState(null);
    const [deleteEmployeeData, setDeleteEmployeeData] = useState(null);
    const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
    const [loadingEditEmployeeDetails, setLoadingEditEmployeeDetails] = useState(false);
    const [savingEmployeeChanges, setSavingEmployeeChanges] = useState(false);
    const [deletingEmployee, setDeletingEmployee] = useState(false);
    const [newEmployeeData, setNewEmployeeData] = useState({
        name: '',
        loginId: '',
        email: '',
        mobile: '',
        type: 'Employee',
        department: '',
        designation: '',
        salary: '',
        joinDate: '',
        address: '',
        emergencyContact: '',
        bloodGroup: '',
        dateOfBirth: '',
        gender: 'Male',
        maritalStatus: 'Single',
        nationality: 'Indian',
        panNumber: '',
        aadharNumber: '',
        bankAccount: '',
        ifscCode: '',
        status: 'Active'
    });

    const fetchEmployees = useCallback(async (page = currentPage, size = pageSize) => {
        setLoading(true);
        setFetchError('');

        try {
            const query = new URLSearchParams({
                page: String(page),
                size: String(size),
                limit: String(size),
                offset: String((page - 1) * size)
            });
            const response = await fetch(`https://jyotiairconditioning.in/websercice/api/employes?${query}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Employee request failed (${response.status}).`);
            }

            const result = await response.json();
            if (result?.success === false) {
                throw new Error(result.message || 'The employee API could not load employees.');
            }

            const employeeData = Array.isArray(result)
                ? result
                : Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result?.data?.employees)
                        ? result.data.employees
                        : Array.isArray(result?.employees)
                            ? result.employees
                            : Array.isArray(result?.data?.data)
                                ? result.data.data
                                : null;

            if (!employeeData) {
                throw new Error(result?.message || 'The employee API returned an invalid response.');
            }

            setEmployees(employeeData.map((employee, index) => {
                const record = employee && typeof employee === 'object' ? employee : {};
                const firstName = record.first_name || record.firstName || '';
                const lastName = record.last_name || record.lastName || '';
                const name = record.name || record.emp_name || record.employee_name || record.employeeName || `${firstName} ${lastName}`.trim();
                const employeeId = record.employee_id || record.employeeId || record.id || record.emp_id || index + 1;

                return {
                    id: employeeId,
                    unique_id: employeeId,
                    name: name || 'N/A',
                    address: record.address || 'N/A',
                    loginId: record.loginId || record.login_id || record.email || 'N/A',
                    type: String(record.employee_type || record.type || record.role || '4'),
                    email: record.email || record.email_address || 'N/A',
                    mobile: record.phone || record.mobile || record.mobile_number || 'N/A',
                    department: record.department || 'N/A',
                    status: record.status || 'N/A',
                    joinDate: record.created_at || record.createdAt || record.join_date || 'N/A',
                    designation: record.designation || record.position || 'N/A',
                    salary: record.salary || 0
                };
            }));
            const total = result?.total_count ?? result?.total
                ?? result?.data?.total_count ?? result?.data?.total
                ?? result?.pagination?.total ?? employeeData.length;
            setTotalRecords(Number(total));
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
            setTotalRecords(0);
            setFetchError(error instanceof Error ? error.message : 'Unable to load employees.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const displayedEmployees = employees
        .filter((employee) => {
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch = !search || [employee.name, employee.unique_id, employee.email, employee.mobile]
                .some(value => String(value).toLowerCase().includes(search));
            const matchesType = !employeeTypeFilter || employee.type === employeeTypeFilter;
            return matchesSearch && matchesType;
        })
        .sort((first, second) => {
            const firstValue = String(first[sortField] || '');
            const secondValue = String(second[sortField] || '');
            const comparison = firstValue.localeCompare(secondValue, undefined, { numeric: true });
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    const totalPages = Math.ceil(totalRecords / pageSize);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(parseInt(size));
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedEmployees(employees.map(emp => emp.id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (employeeId) => {
        setSelectedEmployees(prev => 
            prev.includes(employeeId) 
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    const getStatusBadge = (status) => {
        const badgeClass = status === 'Active' ? 'badge-success' : 'badge-danger';
        return <span className={`badge ${badgeClass}`}>{status}</span>;
    };

    const getTypeBadge = (type) => {
        let badgeClass = 'badge-primary';
        if (type === 'Admin') badgeClass = 'badge-danger';
        else if (type === 'Manager') badgeClass = 'badge-warning';
        else badgeClass = 'badge-success';
        
        return <span className={`badge ${badgeClass}`}>{type}</span>;
    };

    // View Employee Modal Functions
    const handleViewEmployee = async (employeeId) => {
        setLoadingEmployeeDetails(true);
        setEmployeeDetailsError('');
        setShowViewEmployeeModal(true);

        try {
            const employee = await requestEmployeeApi(`/${employeeId}`);
            const name = employee.name || employee.emp_name ||
                `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A';
            setViewEmployeeData({
                id: employee.employee_id || employee.id || employeeId,
                unique_id: employee.employee_id || employee.id || employeeId,
                name,
                email: employee.email || 'N/A',
                mobile: employee.phone || 'N/A',
                address: employee.address || 'N/A',
                type: employee.employee_type || employee.type || 'Employee',
                status: employee.status || 'N/A',
                joinDate: employee.created_at || 'N/A',
                designation: employee.designation || 'N/A',
                department: employee.department || 'N/A',
                salary: employee.salary || 0,
                dateOfBirth: employee.date_of_birth || 'N/A',
                gender: employee.gender || 'N/A',
                maritalStatus: employee.marital_status || 'N/A',
                nationality: employee.nationality || 'N/A',
                emergencyContact: employee.emergency_contact || 'N/A',
                bloodGroup: employee.blood_group || 'N/A',
                panNumber: employee.pan_number || 'N/A',
                aadharNumber: employee.aadhar_number || 'N/A',
                bankAccount: employee.bank_account || 'N/A',
                ifscCode: employee.ifsc_code || 'N/A'
            });
        } catch (error) {
            console.error('Error fetching employee details:', error);
            setViewEmployeeData(null);
            setEmployeeDetailsError(error instanceof Error ? error.message : 'Unable to load employee details.');
        } finally {
            setLoadingEmployeeDetails(false);
        }
    };

    const handleCloseViewModal = () => {
        setShowViewEmployeeModal(false);
        setViewEmployeeData(null);
        setEmployeeDetailsError('');
    };

    // Edit Employee Modal Functions
    const handleEditEmployee = async (employeeId) => {
        setLoadingEditEmployeeDetails(true);
        setEditEmployeeError('');
        setEditEmployeeData(null);
        setShowEditEmployeeModal(true);

        try {
            const employee = await requestEmployeeApi(`/${employeeId}`);
            setEditEmployeeData({
                id: employee.employee_id || employee.id || employeeId,
                unique_id: employee.employee_id || employee.id || employeeId,
                name: employee.name || employee.emp_name ||
                    `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
                email: employee.email || '',
                mobile: employee.phone || '',
                address: employee.address || '',
                type: employee.employee_type || employee.type || 'Employee',
                status: employee.status || 'Active',
                joinDate: employee.join_date || '',
                designation: employee.designation || '',
                department: employee.department || '',
                salary: employee.salary || '',
                dateOfBirth: employee.date_of_birth || '',
                gender: employee.gender || 'Male',
                maritalStatus: employee.marital_status || 'Single',
                nationality: employee.nationality || 'Indian',
                emergencyContact: employee.emergency_contact || '',
                bloodGroup: employee.blood_group || '',
                panNumber: employee.pan_number || '',
                aadharNumber: employee.aadhar_number || '',
                bankAccount: employee.bank_account || '',
                ifscCode: employee.ifsc_code || ''
            });
        } catch (error) {
            console.error('Error fetching employee details for editing:', error);
            setEditEmployeeData(null);
            setEditEmployeeError(error instanceof Error ? error.message : 'Unable to load employee details.');
        } finally {
            setLoadingEditEmployeeDetails(false);
        }
    };

    const handleEditEmployeeInputChange = (e) => {
        const { name, value } = e.target;
        setEditEmployeeData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEditedEmployee = async () => {
        setSavingEmployeeChanges(true);
        setEditEmployeeError('');

        try {
            const [firstName, ...lastName] = editEmployeeData.name.trim().split(/\s+/);
            const result = await requestEmployeeApi(`/${editEmployeeData.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    first_name: firstName || '',
                    last_name: lastName.join(' '),
                    email: editEmployeeData.email.trim(),
                    phone: editEmployeeData.mobile.trim(),
                    designation: editEmployeeData.designation.trim()
                })
            });

            setShowEditEmployeeModal(false);
            setEditEmployeeData(null);
            alert(result?.message || 'Employee updated successfully.');
            await fetchEmployees(currentPage, pageSize);
        } catch (error) {
            console.error('Error updating employee:', error);
            setEditEmployeeError(error instanceof Error ? error.message : 'Unable to update employee.');
        } finally {
            setSavingEmployeeChanges(false);
        }
    };

    const handleCloseEditModal = () => {
        setShowEditEmployeeModal(false);
        setEditEmployeeData(null);
        setEditEmployeeError('');
    };

    // Delete Employee Modal Functions
    const handleDeleteEmployee = (employee) => {
        setDeleteEmployeeData(employee);
        setShowDeleteEmployeeModal(true);
    };

    const handleConfirmDeleteEmployee = async () => {
        setDeletingEmployee(true);
        
        try {
            // Call API service to delete (make inactive) employee
            const result = await EmployeeService.deleteEmployee(deleteEmployeeData.id);

            if (result.success) {
                // Show success message
                alert(`Employee ${deleteEmployeeData.name} has been deactivated successfully!`);
                
                // Close modal and clear data
                setShowDeleteEmployeeModal(false);
                setDeleteEmployeeData(null);
                
                // Refresh employees list
                fetchEmployees(currentPage, pageSize);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Unable to deactivate employee. Please check your connection and try again.');
        } finally {
            setDeletingEmployee(false);
        }
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteEmployeeModal(false);
        setDeleteEmployeeData(null);
    };

    // Add Employee Modal Functions
    const handleAddEmployeeInputChange = (e) => {
        const { name, value } = e.target;
        setNewEmployeeData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveNewEmployee = async () => {
        setSavingNewEmployee(true);
        setAddEmployeeError('');

        try {
            const name = newEmployeeData.name.trim();
            const [firstName, ...lastNameParts] = name.split(/\s+/);
            const response = await fetch('https://jyotiairconditioning.in/websercice/api/employes', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastNameParts.join(' '),
                    email: newEmployeeData.email.trim(),
                    phone: newEmployeeData.mobile.trim(),
                    designation: newEmployeeData.designation.trim()
                })
            });

            const responseText = await response.text();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : null;
            } catch {
                throw new Error(`Employee API returned an unexpected response (HTTP ${response.status}).`);
            }

            if (!response.ok || result?.success === false) {
                const errorCode = result?.data?.error_code;
                const message = result?.message || `Employee creation failed (HTTP ${response.status}).`;
                throw new Error(errorCode ? `${message} (code: ${errorCode})` : message);
            }

            handleCloseModal();
            alert('Employee created successfully.');
            if (currentPage === 1) {
                await fetchEmployees(1, pageSize);
            } else {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            setAddEmployeeError(error instanceof Error
                ? error.message
                : 'Unable to create employee due to an unexpected error.');
        } finally {
            setSavingNewEmployee(false);
        }
    };

    const handleCloseModal = () => {
        setAddEmployeeError('');
        setShowAddEmployeeModal(false);
        setNewEmployeeData({
            name: '',
            loginId: '',
            email: '',
            mobile: '',
            type: 'Employee',
            department: '',
            designation: '',
            salary: '',
            joinDate: '',
            address: '',
            emergencyContact: '',
            bloodGroup: '',
            dateOfBirth: '',
            gender: 'Male',
            maritalStatus: 'Single',
            nationality: 'Indian',
            panNumber: '',
            aadharNumber: '',
            bankAccount: '',
            ifscCode: '',
            status: 'Active'
        });
    };
    return (
        <div className="employee-management">
            <Header />
            
            {/* Enhanced Controls Section */}
            <div className="table-controls">
                <div className="container-fluid">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                            
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-search"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Search by name, email, or login ID..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                           
                            <select 
                                className="form-select"
                                value={employeeTypeFilter}
                                onChange={(e) => {
                                    setEmployeeTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="2">Admin</option>
                                <option value="4">Employee</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                           
                            <select 
                                className="form-select"
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(e.target.value)}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            
                            <div className="bulk-actions">
                                <div className="btn-group" role="group">
                                    <button type="button" className="btn btn-outline-primary">
                                        <i className="fas fa-edit me-1"></i> Edit
                                    </button>
                                    {/* <button type="button" className="btn btn-outline-success">
                                        <i className="fas fa-check me-1"></i> Activate
                                    </button> */}
                                    <button type="button" className="btn btn-outline-danger">
                                        <i className="fas fa-trash me-1"></i> Delete
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary add-employee-btn"
                                        onClick={() => setShowAddEmployeeModal(true)}
                                    >
                                        <i className="fas fa-user-plus me-2"></i>
                                        Add Employee
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>

            {/* Enhanced Table Section */}
            <div className="table-section">
                {/* <div className="table-header">
                    <div className="container-fluid">
                        <div className="row align-items-center">
                            <div className="col">
                                <div className="table-info">
                                    Employee Records ({totalRecords} total)
                                </div>
                            </div>
                            <div className="col-auto">
                                <button className="btn btn-outline-secondary btn-sm">
                                    <i className="fas fa-download me-2"></i>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div> */}

                <div className="table-wrapper">
                    {loading && (
                        <div className="loading-overlay">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}
                    {fetchError && (
                        <div className="alert alert-danger m-3" role="alert">
                            {fetchError}
                            <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={fetchEmployees}>
                                Retry
                            </button>
                        </div>
                    )}
                    
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                {/* <th style={{width: '50px'}}>
                                    <input 
                                        type="checkbox" 
                                        className="form-check-input"
                                        onChange={handleSelectAll}
                                        checked={selectedEmployees.length === employees.length && employees.length > 0}
                                    />
                                </th> */}
                                {/* <th 
                                    className="sortable" 
                                    onClick={() => handleSort('id')}
                                    style={{cursor: 'pointer'}}
                                >
                                    ID {sortField === 'id' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th> */}
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('name')}
                                    style={{cursor: 'pointer', minWidth: '200px'}}
                                >
                                    Name {sortField === 'name' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('id')}
                                    style={{cursor: 'pointer'}}
                                >
                                    Employee ID {sortField === 'id' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('email')}
                                    style={{cursor: 'pointer'}}
                                >
                                    Email {sortField === 'email' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th>
                                <th 
                                    className="sortable" 
                                    onClick={() => handleSort('mobile')}
                                    style={{cursor: 'pointer'}}
                                >
                                    Mobile {sortField === 'mobile' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th>
                                {/* <th 
                                    className="sortable" 
                                    onClick={() => handleSort('department')}
                                    style={{cursor: 'pointer'}}
                                >
                                    Department {sortField === 'department' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th> */}
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('designation')}
                                    style={{cursor: 'pointer'}}
                                >
                                    Designation {sortField === 'designation' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th>
                                <th 
                                    className="sortable"
                                    onClick={() => handleSort('joinDate')}
                                    style={{cursor: 'pointer'}}
                                >
                                    Created At {sortField === 'joinDate' && (
                                        <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                    )}
                                </th>
                                
                                <th style={{width: '150px'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        {loading ? 'Loading employees...' : 'No employees found.'}
                                    </td>
                                </tr>
                            ) : displayedEmployees.map((employee) => (
                                <tr key={employee.id} className={selectedEmployees.includes(employee.id) ? 'table-active' : ''}>
                                    {/* <td>
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input"
                                            checked={selectedEmployees.includes(employee.id)}
                                            onChange={() => handleSelectEmployee(employee.id)}
                                        />
                                    </td> */}
                                    {/* <td>{employee.unique_id}</td> */}
                                    <td style={{minWidth: '200px', wordWrap: 'break-word', whiteSpace: 'normal'}}>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar me-2" style={{
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#007bff', 
                                                color: 'white', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                flexShrink: 0
                                            }}>
                                                {employee.name && employee.name !== 'N/A' ? employee.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                            </div>
                                            <span style={{fontSize: '14px', lineHeight: '1.4'}}>{employee.name}</span>
                                        </div>
                                    </td>
                                    <td>{employee.id}</td>
                                    <td>{employee.email}</td>
                                    <td>{employee.mobile}</td>
                                    <td>{employee.designation}</td>
                                    <td>{employee.joinDate}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-1" 
                                                title="View"
                                                onClick={() => handleViewEmployee(employee.id)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-success me-1" 
                                                title="Edit"
                                                onClick={() => handleEditEmployee(employee.id)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger" 
                                                title="Delete"
                                                onClick={() => handleDeleteEmployee(employee)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {employees.length === 0 && !loading && (
                        <div className="text-center py-5">
                            <i className="fas fa-users fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">No employees found</h5>
                            <p className="text-muted">Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>

                {/* Enhanced Pagination */}
                <div className="pagination-section">
                    <div className="container-fluid">
                        <div className="row align-items-center">
                            <div className="col">
                                <div className="pagination-info">
                                    Showing {startRecord} to {endRecord} of {totalRecords} entries
                                </div>
                            </div>
                            <div className="col-auto">
                                <nav>
                                    <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                        </li>
                                        
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                            let pageNumber;
                                            if (totalPages <= 5) {
                                                pageNumber = index + 1;
                                            } else if (currentPage <= 3) {
                                                pageNumber = index + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + index;
                                            } else {
                                                pageNumber = currentPage - 2 + index;
                                            }
                                            
                                            return (
                                                <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(pageNumber)}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Employee Modal */}
            {showAddEmployeeModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{maxWidth: '90%', width: '1200px'}}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-user-plus me-2 text-white"></i>
                                    Add New Employee
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <form
                                    id="add-employee-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        handleSaveNewEmployee();
                                    }}
                                >
                                    {addEmployeeError && (
                                        <div className="alert alert-danger" role="alert">
                                            {addEmployeeError}
                                        </div>
                                    )}
                                    <div className="row">
                                        {/* Personal Information Section */}
                                        <div className="col-12 mb-4">
                                            <h6 className="section-title">
                                                <i className="fas fa-user me-2"></i>
                                                Personal Information
                                            </h6>
                                        </div>

                                        {/* Full Name and Login ID */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-user me-2"></i>
                                                Full Name *
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="name"
                                                value={newEmployeeData.name}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter full name..."
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-id-card me-2"></i>
                                                Login ID *
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="loginId"
                                                value={newEmployeeData.loginId}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter login ID..."
                                            />
                                        </div>

                                        {/* Email and Mobile */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-envelope me-2"></i>
                                                Email Address *
                                            </label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                name="email"
                                                value={newEmployeeData.email}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter email address..."
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-phone me-2"></i>
                                                Mobile Number *
                                            </label>
                                            <input 
                                                type="tel" 
                                                className="form-control" 
                                                name="mobile"
                                                value={newEmployeeData.mobile}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter mobile number..."
                                                required
                                            />
                                        </div>

                                        {/* Date of Birth and Gender */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-birthday-cake me-2"></i>
                                                Date of Birth
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                name="dateOfBirth"
                                                value={newEmployeeData.dateOfBirth}
                                                onChange={handleAddEmployeeInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-venus-mars me-2"></i>
                                                Gender
                                            </label>
                                            <select 
                                                className="form-select" 
                                                name="gender"
                                                value={newEmployeeData.gender}
                                                onChange={handleAddEmployeeInputChange}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        {/* Marital Status and Blood Group */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-heart me-2"></i>
                                                Marital Status
                                            </label>
                                            <select 
                                                className="form-select" 
                                                name="maritalStatus"
                                                value={newEmployeeData.maritalStatus}
                                                onChange={handleAddEmployeeInputChange}
                                            >
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Divorced">Divorced</option>
                                                <option value="Widowed">Widowed</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-tint me-2"></i>
                                                Blood Group
                                            </label>
                                            <select 
                                                className="form-select" 
                                                name="bloodGroup"
                                                value={newEmployeeData.bloodGroup}
                                                onChange={handleAddEmployeeInputChange}
                                            >
                                                <option value="">Select Blood Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        </div>

                                        {/* Employment Information Section */}
                                        <div className="col-12 mb-4 mt-4">
                                            <h6 className="section-title">
                                                <i className="fas fa-briefcase me-2"></i>
                                                Employment Information
                                            </h6>
                                        </div>

                                        {/* Employee Type and Department */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-user-cog me-2"></i>
                                                Employee Type *
                                            </label>
                                            <select 
                                                className="form-select" 
                                                name="type"
                                                value={newEmployeeData.type}
                                                onChange={handleAddEmployeeInputChange}
                                                required
                                            >
                                                <option value="Employee">Employee</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-building me-2"></i>
                                                Department *
                                            </label>
                                            <select 
                                                className="form-select" 
                                                name="department"
                                                value={newEmployeeData.department}
                                                onChange={handleAddEmployeeInputChange}
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                <option value="IT">IT</option>
                                                <option value="HR">HR</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Sales">Sales</option>
                                                <option value="Operations">Operations</option>
                                            </select>
                                        </div>

                                        {/* Designation and Salary */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-id-badge me-2"></i>
                                                Designation *
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="designation"
                                                value={newEmployeeData.designation}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter designation..."
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-money-bill-wave me-2"></i>
                                                Salary
                                            </label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                name="salary"
                                                value={newEmployeeData.salary}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter salary amount..."
                                            />
                                        </div>

                                        {/* Join Date and Status */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-calendar-alt me-2"></i>
                                                Join Date *
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                name="joinDate"
                                                value={newEmployeeData.joinDate}
                                                onChange={handleAddEmployeeInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-toggle-on me-2"></i>
                                                Status
                                            </label>
                                            <select 
                                                className="form-select" 
                                                name="status"
                                                value={newEmployeeData.status}
                                                onChange={handleAddEmployeeInputChange}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>

                                        {/* Contact Information Section */}
                                        <div className="col-12 mb-4 mt-4">
                                            <h6 className="section-title">
                                                <i className="fas fa-address-book me-2"></i>
                                                Contact Information
                                            </h6>
                                        </div>

                                        {/* Address */}
                                        <div className="col-md-12 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-map-marker-alt me-2"></i>
                                                Address
                                            </label>
                                            <textarea 
                                                className="form-control" 
                                                name="address"
                                                value={newEmployeeData.address}
                                                onChange={handleAddEmployeeInputChange}
                                                rows="3"
                                                placeholder="Enter complete address..."
                                            ></textarea>
                                        </div>

                                        {/* Emergency Contact and Nationality */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-phone-alt me-2"></i>
                                                Emergency Contact
                                            </label>
                                            <input 
                                                type="tel" 
                                                className="form-control" 
                                                name="emergencyContact"
                                                value={newEmployeeData.emergencyContact}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter emergency contact number..."
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-flag me-2"></i>
                                                Nationality
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="nationality"
                                                value={newEmployeeData.nationality}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter nationality..."
                                            />
                                        </div>

                                        {/* Identity Information Section */}
                                        <div className="col-12 mb-4 mt-4">
                                            <h6 className="section-title">
                                                <i className="fas fa-id-card-alt me-2"></i>
                                                Identity & Banking Information
                                            </h6>
                                        </div>

                                        {/* PAN and Aadhar */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-credit-card me-2"></i>
                                                PAN Number
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="panNumber"
                                                value={newEmployeeData.panNumber}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter PAN number..."
                                                style={{textTransform: 'uppercase'}}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-id-card me-2"></i>
                                                Aadhar Number
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="aadharNumber"
                                                value={newEmployeeData.aadharNumber}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter Aadhar number..."
                                            />
                                        </div>

                                        {/* Bank Account and IFSC Code */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-university me-2"></i>
                                                Bank Account Number
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="bankAccount"
                                                value={newEmployeeData.bankAccount}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter bank account number..."
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <i className="fas fa-code me-2"></i>
                                                IFSC Code
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="ifscCode"
                                                value={newEmployeeData.ifscCode}
                                                onChange={handleAddEmployeeInputChange}
                                                placeholder="Enter IFSC code..."
                                                style={{textTransform: 'uppercase'}}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    form="add-employee-form"
                                    className="btn btn-success"
                                    disabled={savingNewEmployee}
                                >
                                    {savingNewEmployee ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-user-plus me-2"></i>
                                            Add Employee
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* View Employee Modal */}
            {showViewEmployeeModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header" style={{minHeight: 'auto', padding: '0.75rem 1rem'}}>
                                <h5 className="modal-title" style={{fontSize: '1.1rem', margin: 0}}>
                                    <i className="fas fa-user me-2"></i>
                                    Employee Details
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    style={{fontSize: '0.8rem'}}
                                    onClick={handleCloseViewModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {loadingEmployeeDetails ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading employee details...</p>
                                    </div>
                                ) : employeeDetailsError ? (
                                    <div className="alert alert-danger" role="alert">{employeeDetailsError}</div>
                                ) : viewEmployeeData ? (
                                    <div className="row">
                                        {/* Employee Header with Avatar */}
                                        <div className="col-12 mb-4">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar me-3" style={{
                                                    width: '80px', 
                                                    height: '80px', 
                                                    borderRadius: '50%', 
                                                    backgroundColor: '#007bff', 
                                                    color: 'white', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    fontSize: '24px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {viewEmployeeData.name && viewEmployeeData.name !== 'N/A' ? 
                                                        viewEmployeeData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="mb-1">{viewEmployeeData.name}</h4>
                                                    <p className="text-muted mb-1">ID: {viewEmployeeData.unique_id}</p>
                                                    <div className="d-flex gap-2">
                                                        {getTypeBadge(viewEmployeeData.type)}
                                                        {getStatusBadge(viewEmployeeData.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Personal Information */}
                                        <div className="col-12 mb-3">
                                            <h6 className="border-bottom pb-2 mb-3">
                                                <i className="fas fa-user me-2"></i>
                                                Personal Information
                                            </h6>
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Full Name</label>
                                            <p className="fw-bold">{viewEmployeeData.name}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Employee ID</label>
                                            <p className="fw-bold">{viewEmployeeData.unique_id}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Date of Birth</label>
                                            <p className="fw-bold">{viewEmployeeData.dateOfBirth}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Gender</label>
                                            <p className="fw-bold">{viewEmployeeData.gender}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Marital Status</label>
                                            <p className="fw-bold">{viewEmployeeData.maritalStatus}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Blood Group</label>
                                            <p className="fw-bold">{viewEmployeeData.bloodGroup}</p>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="col-12 mb-3 mt-4">
                                            <h6 className="border-bottom pb-2 mb-3">
                                                <i className="fas fa-address-book me-2"></i>
                                                Contact Information
                                            </h6>
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Email Address</label>
                                            <p className="fw-bold">{viewEmployeeData.email}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Mobile Number</label>
                                            <p className="fw-bold">{viewEmployeeData.mobile}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Emergency Contact</label>
                                            <p className="fw-bold">{viewEmployeeData.emergencyContact}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Nationality</label>
                                            <p className="fw-bold">{viewEmployeeData.nationality}</p>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <label className="form-label text-muted small">Address</label>
                                            <p className="fw-bold">{viewEmployeeData.address}</p>
                                        </div>

                                        {/* Employment Information */}
                                        <div className="col-12 mb-3 mt-4">
                                            <h6 className="border-bottom pb-2 mb-3">
                                                <i className="fas fa-briefcase me-2"></i>
                                                Employment Information
                                            </h6>
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Department</label>
                                            <p className="fw-bold">{viewEmployeeData.department}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Designation</label>
                                            <p className="fw-bold">{viewEmployeeData.designation}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Join Date</label>
                                            <p className="fw-bold">{viewEmployeeData.joinDate}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Salary</label>
                                            <p className="fw-bold">₹{viewEmployeeData.salary}</p>
                                        </div>

                                        {/* Identity Information */}
                                        <div className="col-12 mb-3 mt-4">
                                            <h6 className="border-bottom pb-2 mb-3">
                                                <i className="fas fa-id-card-alt me-2"></i>
                                                Identity & Banking Information
                                            </h6>
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">PAN Number</label>
                                            <p className="fw-bold">{viewEmployeeData.panNumber}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Aadhar Number</label>
                                            <p className="fw-bold">{viewEmployeeData.aadharNumber}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">Bank Account</label>
                                            <p className="fw-bold">{viewEmployeeData.bankAccount}</p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small">IFSC Code</label>
                                            <p className="fw-bold">{viewEmployeeData.ifscCode}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                        <h5>Unable to Load Employee Details</h5>
                                        <p className="text-muted">Please try again later.</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseViewModal}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        handleCloseViewModal();
                                        handleEditEmployee(viewEmployeeData.id);
                                    }}
                                >
                                    <i className="fas fa-edit me-2"></i>
                                    Edit Employee
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Employee Modal */}
            {showEditEmployeeModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{maxWidth: '90%', width: '1200px'}}>
                        <div className="modal-content">
                            <div className="modal-header" style={{minHeight: 'auto', padding: '0.75rem 1rem'}}>
                                <h5 className="modal-title" style={{fontSize: '1.1rem', margin: 0}}>
                                    <i className="fas fa-edit me-2"></i>
                                    Edit Employee
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    style={{fontSize: '0.8rem'}}
                                    onClick={handleCloseEditModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {loadingEditEmployeeDetails ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading employee details...</p>
                                    </div>
                                ) : editEmployeeError ? (
                                    <div className="alert alert-danger" role="alert">{editEmployeeError}</div>
                                ) : editEmployeeData ? (
                                    <div className="alert alert-info" role="status">
                                        Only the employee name, email, phone, and designation are stored by this API.
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                        <h5>Unable to Load Employee Details</h5>
                                        <p className="text-muted">Please try again later.</p>
                                    </div>
                                )}
                                {editEmployeeData && !loadingEditEmployeeDetails && (
                                    <form>
                                        <div className="row">
                                            {/* Personal Information Section */}
                                            <div className="col-12 mb-4">
                                                <h6 className="section-title">
                                                    <i className="fas fa-user me-2"></i>
                                                    Personal Information
                                                </h6>
                                            </div>

                                            {/* Full Name and Employee ID */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-user me-2"></i>
                                                    Full Name *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="name"
                                                    value={editEmployeeData.name}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter full name..."
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-id-card me-2"></i>
                                                    Employee ID
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    value={editEmployeeData.unique_id}
                                                    disabled
                                                    style={{backgroundColor: '#f8f9fa'}}
                                                />
                                            </div>

                                            {/* Email and Mobile */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-envelope me-2"></i>
                                                    Email Address *
                                                </label>
                                                <input 
                                                    type="email" 
                                                    className="form-control" 
                                                    name="email"
                                                    value={editEmployeeData.email}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter email address..."
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-phone me-2"></i>
                                                    Mobile Number *
                                                </label>
                                                <input 
                                                    type="tel" 
                                                    className="form-control" 
                                                    name="mobile"
                                                    value={editEmployeeData.mobile}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter mobile number..."
                                                    required
                                                />
                                            </div>

                                            {/* Date of Birth and Gender */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-birthday-cake me-2"></i>
                                                    Date of Birth
                                                </label>
                                                <input 
                                                    type="date" 
                                                    className="form-control" 
                                                    name="dateOfBirth"
                                                    value={editEmployeeData.dateOfBirth}
                                                    onChange={handleEditEmployeeInputChange}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-venus-mars me-2"></i>
                                                    Gender
                                                </label>
                                                <select 
                                                    className="form-select" 
                                                    name="gender"
                                                    value={editEmployeeData.gender}
                                                    onChange={handleEditEmployeeInputChange}
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            {/* Marital Status and Blood Group */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-heart me-2"></i>
                                                    Marital Status
                                                </label>
                                                <select 
                                                    className="form-select" 
                                                    name="maritalStatus"
                                                    value={editEmployeeData.maritalStatus}
                                                    onChange={handleEditEmployeeInputChange}
                                                >
                                                    <option value="Single">Single</option>
                                                    <option value="Married">Married</option>
                                                    <option value="Divorced">Divorced</option>
                                                    <option value="Widowed">Widowed</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-tint me-2"></i>
                                                    Blood Group
                                                </label>
                                                <select 
                                                    className="form-select" 
                                                    name="bloodGroup"
                                                    value={editEmployeeData.bloodGroup}
                                                    onChange={handleEditEmployeeInputChange}
                                                >
                                                    <option value="">Select Blood Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                </select>
                                            </div>

                                            {/* Employment Information Section */}
                                            <div className="col-12 mb-4 mt-4">
                                                <h6 className="section-title">
                                                    <i className="fas fa-briefcase me-2"></i>
                                                    Employment Information
                                                </h6>
                                            </div>

                                            {/* Employee Type and Department */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-user-cog me-2"></i>
                                                    Employee Type *
                                                </label>
                                                <select 
                                                    className="form-select" 
                                                    name="type"
                                                    value={editEmployeeData.type}
                                                    onChange={handleEditEmployeeInputChange}
                                                    required
                                                >
                                                    <option value="Employee">Employee</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-building me-2"></i>
                                                    Department *
                                                </label>
                                                <select 
                                                    className="form-select" 
                                                    name="department"
                                                    value={editEmployeeData.department}
                                                    onChange={handleEditEmployeeInputChange}
                                                    required
                                                >
                                                    <option value="">Select Department</option>
                                                    <option value="IT">IT</option>
                                                    <option value="HR">HR</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="Marketing">Marketing</option>
                                                    <option value="Sales">Sales</option>
                                                    <option value="Operations">Operations</option>
                                                </select>
                                            </div>

                                            {/* Designation and Salary */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-id-badge me-2"></i>
                                                    Designation *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="designation"
                                                    value={editEmployeeData.designation}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter designation..."
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-money-bill-wave me-2"></i>
                                                    Salary
                                                </label>
                                                <input 
                                                    type="number" 
                                                    className="form-control" 
                                                    name="salary"
                                                    value={editEmployeeData.salary}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter salary amount..."
                                                />
                                            </div>

                                            {/* Join Date and Status */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-calendar-alt me-2"></i>
                                                    Join Date *
                                                </label>
                                                <input 
                                                    type="date" 
                                                    className="form-control" 
                                                    name="joinDate"
                                                    value={editEmployeeData.joinDate}
                                                    onChange={handleEditEmployeeInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-toggle-on me-2"></i>
                                                    Status
                                                </label>
                                                <select 
                                                    className="form-select" 
                                                    name="status"
                                                    value={editEmployeeData.status}
                                                    onChange={handleEditEmployeeInputChange}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            </div>

                                            {/* Contact Information Section */}
                                            <div className="col-12 mb-4 mt-4">
                                                <h6 className="section-title">
                                                    <i className="fas fa-address-book me-2"></i>
                                                    Contact Information
                                                </h6>
                                            </div>

                                            {/* Address */}
                                            <div className="col-md-12 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-map-marker-alt me-2"></i>
                                                    Address
                                                </label>
                                                <textarea 
                                                    className="form-control" 
                                                    name="address"
                                                    value={editEmployeeData.address}
                                                    onChange={handleEditEmployeeInputChange}
                                                    rows="3"
                                                    placeholder="Enter complete address..."
                                                ></textarea>
                                            </div>

                                            {/* Emergency Contact and Nationality */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-phone-alt me-2"></i>
                                                    Emergency Contact
                                                </label>
                                                <input 
                                                    type="tel" 
                                                    className="form-control" 
                                                    name="emergencyContact"
                                                    value={editEmployeeData.emergencyContact}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter emergency contact number..."
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-flag me-2"></i>
                                                    Nationality
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="nationality"
                                                    value={editEmployeeData.nationality}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter nationality..."
                                                />
                                            </div>

                                            {/* Identity Information Section */}
                                            <div className="col-12 mb-4 mt-4">
                                                <h6 className="section-title">
                                                    <i className="fas fa-id-card-alt me-2"></i>
                                                    Identity & Banking Information
                                                </h6>
                                            </div>

                                            {/* PAN and Aadhar */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-credit-card me-2"></i>
                                                    PAN Number
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="panNumber"
                                                    value={editEmployeeData.panNumber}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter PAN number..."
                                                    style={{textTransform: 'uppercase'}}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-id-card me-2"></i>
                                                    Aadhar Number
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="aadharNumber"
                                                    value={editEmployeeData.aadharNumber}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter Aadhar number..."
                                                />
                                            </div>

                                            {/* Bank Account and IFSC Code */}
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-university me-2"></i>
                                                    Bank Account Number
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="bankAccount"
                                                    value={editEmployeeData.bankAccount}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter bank account number..."
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    <i className="fas fa-code me-2"></i>
                                                    IFSC Code
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    name="ifscCode"
                                                    value={editEmployeeData.ifscCode}
                                                    onChange={handleEditEmployeeInputChange}
                                                    placeholder="Enter IFSC code..."
                                                    style={{textTransform: 'uppercase'}}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                )  (
                                    <div className="text-center py-5">
                                        <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                        <h5>Unable to Load Employee Details</h5>
                                        <p className="text-muted">Please try again later.</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseEditModal}
                                    disabled={savingEmployeeChanges}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={handleSaveEditedEmployee}
                                    disabled={savingEmployeeChanges || !editEmployeeData?.name || !editEmployeeData?.email || !editEmployeeData?.mobile || !editEmployeeData?.designation}
                                >
                                    {savingEmployeeChanges ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save me-2"></i>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Employee Confirmation Modal */}
            {showDeleteEmployeeModal && deleteEmployeeData && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header" style={{minHeight: 'auto', padding: '0.75rem 1rem', backgroundColor: '#dc3545', color: 'white'}}>
                                <h5 className="modal-title" style={{fontSize: '1.1rem', margin: 0}}>
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Confirm Delete
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    style={{fontSize: '0.8rem'}}
                                    onClick={handleCloseDeleteModal}
                                    disabled={deletingEmployee}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center">
                                    {/* Employee Info */}
                                    <div className="mb-4">
                                        <div className="avatar mx-auto mb-3" style={{
                                            width: '60px', 
                                            height: '60px', 
                                            borderRadius: '50%', 
                                            backgroundColor: '#dc3545', 
                                            color: 'white', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontSize: '20px',
                                            fontWeight: 'bold'
                                        }}>
                                            {deleteEmployeeData.name && deleteEmployeeData.name !== 'N/A' ? 
                                                deleteEmployeeData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                        </div>
                                        <h5 className="mb-2">{deleteEmployeeData.name}</h5>
                                        <p className="text-muted mb-1">ID: {deleteEmployeeData.unique_id}</p>
                                        <p className="text-muted mb-0">{deleteEmployeeData.email}</p>
                                    </div>

                                    {/* Warning Message */}
                                    <div className="alert alert-warning" role="alert">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        <strong>Warning!</strong> This action will deactivate the employee.
                                    </div>

                                    {/* Confirmation Text */}
                                    <div className="mb-4">
                                        <h6 className="text-danger mb-3">Are you sure you want to delete this employee?</h6>
                                        <ul className="list-unstyled text-start">
                                            <li className="mb-2">
                                                <i className="fas fa-check text-success me-2"></i>
                                                Employee status will be changed to <strong>Inactive</strong>
                                            </li>
                                            <li className="mb-2">
                                                <i className="fas fa-check text-success me-2"></i>
                                                Employee data will be preserved
                                            </li>
                                            <li className="mb-2">
                                                <i className="fas fa-info-circle text-info me-2"></i>
                                                This action can be reversed by reactivating the employee
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Final Confirmation */}
                                    <div className="bg-light p-3 rounded">
                                        <p className="mb-0 text-muted">
                                            <small>
                                                <strong>Note:</strong> The employee will no longer have access to the system but their records will remain for historical purposes.
                                            </small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseDeleteModal}
                                    disabled={deletingEmployee}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger"
                                    onClick={handleConfirmDeleteEmployee}
                                    disabled={deletingEmployee}
                                >
                                    {deletingEmployee ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Deactivating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-user-slash me-2"></i>
                                            Yes, Deactivate Employee
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <Footer />
        </div>
    );
}

export default Employee