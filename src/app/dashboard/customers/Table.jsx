import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from "next/navigation";

const columns = [
  "ID",
  "Name",
  "Mobile No",
  "Email",
  "Activities",
  "Updation",
];

export default function DataTable() {
  const [customers, setCustomers] = useState([]);
  const [customerActivities, setCustomerActivities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const fetchCustomers = async () => {
    try {
      const response = await fetch("http://localhost:8000/customers/");
      const data = await response.json();
      setCustomers(data);
      
      // Fetch activities count for each customer
      data.forEach(customer => {
        fetchCustomerActivities(customer.customer_id);
      });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCustomerActivities = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:8000/activities/customer/${customerId}`);
      const data = await response.json();
      setCustomerActivities(prev => ({
        ...prev,
        [customerId]: data.length
      }));
    } catch (error) {
      console.log(error);
      setCustomerActivities(prev => ({
        ...prev,
        [customerId]: 0
      }));
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Rest of the existing functions remain the same...
  const handleView = (customerId) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const initiateDelete = (customerId) => {
    setSelectedCustomerId(customerId);
    setPassword("");
    setPasswordError("");
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (password !== "Mytro") {
      setPasswordError("Incorrect password");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/customers/${selectedCustomerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      setDeleteDialogOpen(false);
      await fetchCustomers();
      setSelectedCustomerId(null);
      setPassword("");
      setPasswordError("");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (customerId) => {
    router.push(`/dashboard/customers/update/${customerId}`);
  };

  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedCustomerId(null);
    setPassword("");
    setPasswordError("");
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery);
    const matchesFilter = filterStatus === "all" || filterStatus === ""
      ? true
      : customer.activity_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredCustomers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredCustomers.length / entriesPerPage);
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <section className="relative">
      {/* Search and Controls section remains the same... */}
      <div className="rounded-lg border p-4 shadow-sm space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select
            value={String(entriesPerPage)}
            onValueChange={(value) => setEntriesPerPage(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 md:max-w-xs">
            <Input
              type="search"
              placeholder="Search customers..."
              className="w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEntries.length > 0 ? (
                currentEntries.map((customer, index) => (
                  <TableRow key={customer.customer_id || index}>
                    <TableCell>{customer.customer_id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.mobile}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      {customerActivities[customer.customer_id] || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 align-middle">
                        <button
                          onClick={() => handleView(customer.customer_id)}
                          className="flex items-center bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleUpdate(customer.customer_id)}
                          className="flex items-center bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600 focus:outline-none"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => initiateDelete(customer.customer_id)}
                          className="flex items-center bg-red-500 text-white p-2 rounded-md hover:bg-red-600 focus:outline-none"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No matching customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Dialog and Pagination remain the same... */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Are you sure you want to delete this customer? This action cannot be undone.</p>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password to confirm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </section>
  );
}