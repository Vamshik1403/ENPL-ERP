// E:\ENPL\ENPL-ERP\frontend\src\app\(no-sidebar)\tasks\view\[engineerId]\[taskId]\page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface TaskImage {
  id: number;
  taskId: number;
  filename: string;
  filepath: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: string; // Engineer ID who uploaded
  uploadedByName?: string; // Engineer name who uploaded
}

interface Department {
  id: number;
  departmentName: string;
}

interface AddressBook {
  id: number;
  addressBookID: string;
  customerName: string;
  addressType: string;
  regdAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface Site {
  id: number;
  siteID: string;
  siteName: string;
  addressBookId: number;
  siteAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface ServiceWorkscopeCategory {
  id: number;
  workscopeCategoryName: string;
}

interface TasksContacts {
  id?: number;
  taskId: number;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
}

interface TasksWorkscopeDetails {
  id?: number;
  taskId: number;
  workscopeCategoryId: number;
  workscopeDetails: string;
  extraNote?: string;
  workscopeCategory?: {
    workscopeCategoryName: string;
  };
}

interface TasksSchedule {
  id?: number;
  taskId: number;
  proposedDateTime: string;
  priority: string;
}

interface TasksRemarks {
  id?: number;
  taskId: number;
  remark: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface TaskInventory {
  id: number;
  taskId: number;
  serviceContractId: number;
  productTypeId: number;
  makeModel: string;
  snMac: string;
  description: string;
  purchaseDate: string;
  warrantyPeriod: string;
  warrantyStatus: string;
  thirdPartyPurchase: boolean;
  productType?: {
    productName: string;
  };
}

interface Engineer {
  id: number;
  engineerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  telegramChatId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EngineerAssignment {
  id: number;
  taskId: number;
  engineerId: number;
  assignedDate: string;
  proposedDateTime: string;
  priority: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  engineer: Engineer;
}

interface Task {
  id?: number;
  taskID: string;
  departmentId: number;
  addressBookId: number;
  siteId: number;
  status: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  taskType: string;
  engineerTaskId?: string;
  contacts?: TasksContacts[];
  workscopeDetails?: TasksWorkscopeDetails[];
  schedule?: TasksSchedule[];
  remarks?: TasksRemarks[];
  taskInventories?: TaskInventory[];
  engineerAssignments?: EngineerAssignment[];
  department?: Department;
  addressBook?: AddressBook;
  site?: Site;
}

export default function ViewTaskPage() {
  const params = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [taskImages, setTaskImages] = useState<TaskImage[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [serviceWorkscopeCategories, setServiceWorkscopeCategories] = useState<ServiceWorkscopeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedImage, setSelectedImage] = useState<TaskImage | null>(null);
  const [currentEngineer, setCurrentEngineer] = useState<Engineer | null>(null);
  
  // Get both parameters from the URL
  const engineerId = params?.engineerId as string;
  const taskId = params?.taskId as string;

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    basicInfo: true,
    engineerInfo: true,
    taskContacts: false,
    workscopeDetails: false,
    schedule: false,
    remarks: false,
    inventories: false,
  });

  // Fix hydration by ensuring this only runs on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && engineerId && taskId) {
      fetchTaskData();
    }
  }, [isClient, engineerId, taskId]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      
      // First, find the engineer by their engineerId
      const engineersRes = await fetch('http://localhost:8000/engineer');
      if (!engineersRes.ok) throw new Error('Failed to fetch engineers');
      
      const engineers = await engineersRes.json();
      const engineer = engineers.find((e: Engineer) => e.engineerId === engineerId);
      
      if (!engineer) {
        throw new Error(`Engineer with ID ${engineerId} not found`);
      }
      
      setCurrentEngineer(engineer);
      
      // Fetch all tasks and find the one with matching taskID
      const tasksRes = await fetch('http://localhost:8000/task');
      
      if (!tasksRes.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const allTasks = await tasksRes.json();
      const taskData = allTasks.find((task: Task) => task.taskID === taskId);
      
      if (!taskData) {
        throw new Error(`Task with ID "${taskId}" not found.`);
      }
      
      // Verify that this engineer is assigned to this task
      const isAssigned = taskData.engineerAssignments?.some(
        (assignment: EngineerAssignment) => assignment.engineerId === engineer.id
      );

      if (!isAssigned) {
        throw new Error(`Engineer ${engineerId} is not assigned to this task`);
      }
      
      // Now fetch related data using the actual task ID from the task data
      const [imagesRes, deptRes, addressRes, sitesRes, workscopeRes] = await Promise.all([
        fetch(`http://localhost:8000/task-images/${taskData.id}`),
        fetch('http://localhost:8000/department'),
        fetch('http://localhost:8000/address-book'),
        fetch('http://localhost:8000/sites'),
        fetch('http://localhost:8000/workscope-category')
      ]);

      const imagesData = imagesRes.ok ? await imagesRes.json() : [];
      const deptData = await deptRes.json();
      const addressData = await addressRes.json();
      const sitesData = await sitesRes.json();
      const workscopeData = await workscopeRes.json();

      setTask(taskData);
      setTaskImages(imagesData);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setAddressBooks(Array.isArray(addressData) ? addressData : []);
      setSites(Array.isArray(sitesData) ? sitesData : []);
      setServiceWorkscopeCategories(Array.isArray(workscopeData) ? workscopeData : []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

 const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0 || !task || !currentEngineer) return;

  try {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    // Add uploader information
    formData.append('uploadedBy', currentEngineer.engineerId);
    formData.append('uploadedByName', `${currentEngineer.firstName} ${currentEngineer.lastName}`);

    const response = await fetch(`http://localhost:8000/task-images/${task.id}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload images: ${error}`);
    }

    await fetchTaskData();
    event.target.value = '';
    
  } catch (err) {
    console.error('Upload error:', err);
    setError(err instanceof Error ? err.message : 'Failed to upload images');
  } finally {
    setUploading(false);
  }
};

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`http://localhost:8000/task-images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete image');

      setTaskImages(prev => prev.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleDownloadImage = async (image: TaskImage) => {
    try {
      const response = await fetch(`http://localhost:8000/task-images/image/${image.filename}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download image');
    }
  };

  const openFullScreenImage = (image: TaskImage) => {
    setSelectedImage(image);
  };

  const closeFullScreenImage = () => {
    setSelectedImage(null);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper functions to get related data
  const getDepartmentName = (departmentId: number) => {
    return departments.find(d => d.id === departmentId)?.departmentName || 'N/A';
  };

  const getCustomerName = (addressBookId: number) => {
    return addressBooks.find(ab => ab.id === addressBookId)?.customerName || 'N/A';
  };

  const getSiteName = (siteId: number) => {
    return sites.find(s => s.id === siteId)?.siteName || 'N/A';
  };

  const getWorkscopeCategoryName = (workscopeCategoryId: number) => {
    return serviceWorkscopeCategories.find(cat => cat.id === workscopeCategoryId)?.workscopeCategoryName || 'N/A';
  };

  // Get the specific assignment for this engineer
  const getCurrentEngineerAssignment = () => {
    if (!task?.engineerAssignments || !currentEngineer) return null;
    return task.engineerAssignments.find(a => a.engineerId === currentEngineer.id);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-gray-100 text-gray-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Work in Progress': 'bg-yellow-100 text-yellow-800',
      'On-Hold': 'bg-orange-100 text-orange-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'Scheduled': 'bg-indigo-100 text-indigo-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Show loading state only on client to avoid hydration mismatch
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-red-600 text-xl text-center">{error}</div>
    </div>
  );

  if (!task) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600 text-xl text-center">Task not found</div>
    </div>
  );

  const currentAssignment = getCurrentEngineerAssignment();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">Task Details</h1>
              <p className="text-blue-100">Task ID: {task.taskID}</p>
              {currentEngineer && (
                <p className="text-blue-100 text-sm mt-2 flex items-center gap-2">
                  <span className="bg-blue-500 px-2 py-1 rounded">
                    Viewing as: {currentEngineer.firstName} {currentEngineer.lastName}
                  </span>
                </p>
              )}
            </div>
          {task && (
  <div className="bg-white text-blue-800 px-4 py-2 rounded-lg">
    <span className="font-semibold">Task Status:</span>
    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
      task.status === 'Open' ? 'bg-gray-100 text-gray-800' : 
      task.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
      task.status === 'Completed' ? 'bg-green-100 text-green-800' :
      'bg-blue-100 text-blue-800'
    }`}>
      {task.status}
    </span>
  </div>
)}
          </div>
        </div>

        {/* Basic Information */}
        <CollapsibleSection
          title="Task Basic Information"
          isOpen={openSections.basicInfo}
          onToggle={() => toggleSection('basicInfo')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ReadonlyField label="Task ID" value={task.taskID} />
            <ReadonlyField label="Engineer Task ID" value={task.engineerTaskId || 'N/A'} />
            <ReadonlyField label="Title" value={task.title} />
            <ReadonlyField label="Type" value={task.taskType} />
            <ReadonlyField label="Status" value={task.status} />
            <ReadonlyField label="Department" value={getDepartmentName(task.departmentId)} />
            <ReadonlyField label="Customer" value={getCustomerName(task.addressBookId)} />
            <ReadonlyField label="Site" value={getSiteName(task.siteId)} />
            <ReadonlyField label="Created By" value={task.createdBy} />
            <ReadonlyField
              label="Created At"
              value={new Date(task.createdAt).toLocaleString()}
            />
            {task.description && (
              <div className="md:col-span-2">
                <ReadonlyField label="Description" value={task.description} />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Engineer Assignments */}
        {task.engineerAssignments && task.engineerAssignments.length > 0 && (
          <CollapsibleSection
            title="Engineer Assignments"
            isOpen={openSections.engineerInfo}
            onToggle={() => toggleSection('engineerInfo')}
          >
            <div className="space-y-4">
              {task.engineerAssignments.map((assignment) => {
                const isCurrentEngineer = assignment.engineerId === currentEngineer?.id;
                return (
                  <div 
                    key={assignment.id} 
                    className={`rounded-lg p-4 border-2 transition-all ${
                      isCurrentEngineer 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold ${
                          isCurrentEngineer ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                        }`}>
                          {assignment.engineer.firstName?.[0]}{assignment.engineer.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {assignment.engineer.firstName} {assignment.engineer.lastName}
                            {isCurrentEngineer && (
                              <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{assignment.engineer.engineerId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Assigned</p>
                        <p className="text-sm">{new Date(assignment.assignedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Priority</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                          {assignment.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Proposed Date</p>
                        <p className="text-sm mt-1">
                          {assignment.proposedDateTime 
                            ? new Date(assignment.proposedDateTime).toLocaleString()
                            : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm mt-1">{assignment.engineer.phoneNumber}</p>
                      </div>
                    </div>
                    
                    {assignment.notes && (
                      <div className="mt-3 p-2 bg-gray-100 rounded">
                        <p className="text-xs text-gray-500">Notes:</p>
                        <p className="text-sm">{assignment.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Customer Information */}
        {(task.addressBook || task.site) && (
          <CollapsibleSection
            title="Customer Information"
            isOpen={openSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {task.addressBook && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium text-gray-900">{task.addressBook.customerName}</p>
                  {task.addressBook.regdAddress && (
                    <>
                      <p className="text-sm text-gray-500 mt-2">Registered Address</p>
                      <p className="text-gray-700">{task.addressBook.regdAddress}</p>
                      <p className="text-gray-600 text-sm">
                        {task.addressBook.city}, {task.addressBook.state} - {task.addressBook.pinCode}
                      </p>
                    </>
                  )}
                </div>
              )}
              {task.site && (
                <div>
                  <p className="text-sm text-gray-500">Site Information</p>
                  <p className="font-medium text-gray-900">{task.site.siteName}</p>
                  {task.site.siteAddress && (
                    <>
                      <p className="text-gray-700 mt-1">{task.site.siteAddress}</p>
                      <p className="text-gray-600 text-sm">
                        {task.site.city}, {task.site.state} - {task.site.pinCode}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Task Contacts */}
        {task.contacts && task.contacts.length > 0 && (
          <CollapsibleSection
            title="Task Contacts"
            isOpen={openSections.taskContacts}
            onToggle={() => toggleSection('taskContacts')}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">Name</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">Number</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {task.contacts.map((contact, index) => (
                    <tr key={contact.id || index} className="hover:bg-gray-50">
                      <td className="p-3 border border-gray-200">{contact.contactName}</td>
                      <td className="p-3 border border-gray-200">{contact.contactNumber}</td>
                      <td className="p-3 border border-gray-200">{contact.contactEmail || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Workscope Details */}
        {task.workscopeDetails && task.workscopeDetails.length > 0 && (
          <CollapsibleSection
            title="Workscope Details"
            isOpen={openSections.workscopeDetails}
            onToggle={() => toggleSection('workscopeDetails')}
          >
            <div className="space-y-3">
              {task.workscopeDetails.map((workscope, index) => (
                <div key={workscope.id || index} className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">
                    {serviceWorkscopeCategories.find(c => c.id === workscope.workscopeCategoryId)?.workscopeCategoryName || 'Category'}
                  </p>
                  <p className="text-gray-900 mt-2">{workscope.workscopeDetails}</p>
                  {workscope.extraNote && (
                    <p className="text-sm text-gray-600 mt-2 italic">Note: {workscope.extraNote}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Schedule */}
        {task.schedule && task.schedule.length > 0 && (
          <CollapsibleSection
            title="Schedule"
            isOpen={openSections.schedule}
            onToggle={() => toggleSection('schedule')}
          >
            <div className="space-y-3">
              {task.schedule.map((schedule, index) => (
                <div key={schedule.id || index} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Proposed Date & Time</p>
                    <p className="font-medium">{new Date(schedule.proposedDateTime).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(schedule.priority)}`}>
                    {schedule.priority}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Task Inventories */}
        {task.taskInventories && task.taskInventories.length > 0 && (
          <CollapsibleSection
            title="Inventory Items"
            isOpen={openSections.inventories}
            onToggle={() => toggleSection('inventories')}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">Product</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">Make/Model</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">SN/MAC</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">Warranty</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100">3rd Party</th>
                  </tr>
                </thead>
                <tbody>
                  {task.taskInventories.map((inventory) => (
                    <tr key={inventory.id} className="hover:bg-gray-50">
                      <td className="p-3 border border-gray-200">{inventory.productType?.productName || 'N/A'}</td>
                      <td className="p-3 border border-gray-200">{inventory.makeModel}</td>
                      <td className="p-3 border border-gray-200">{inventory.snMac}</td>
                      <td className="p-3 border border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inventory.warrantyStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inventory.warrantyStatus}
                        </span>
                        {inventory.warrantyPeriod && (
                          <span className="ml-2 text-xs text-gray-500">({inventory.warrantyPeriod})</span>
                        )}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {inventory.thirdPartyPurchase ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Remarks History */}
        {task.remarks && task.remarks.length > 0 && (
          <CollapsibleSection
            title="Remarks History"
            isOpen={openSections.remarks}
            onToggle={() => toggleSection('remarks')}
          >
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {[...task.remarks]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((remark, index) => (
                  <div key={remark.id || index} className="border-l-4 border-blue-500 bg-white rounded-r-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(remark.status)}`}>
                        {remark.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(remark.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{remark.remark}</p>
                    <p className="text-xs text-gray-500">- {remark.createdBy}</p>
                  </div>
                ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Service Reports & Documents */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Service Reports & Documents</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {taskImages.length} files
            </span>
          </div>
          
          {/* Upload Button */}
          <div className="mb-4">
            <label className="block w-full">
              <div className={`w-full text-center py-3 rounded-lg border-2 border-dashed transition-colors ${uploading ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer'}`}>
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600 font-medium">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-600 font-medium">Choose Images</span>
                    <span className="text-gray-500 text-sm mt-1">Upload PDFs and PNG, JPG, JPEG up to 10MB</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Images Grid with Uploader Info */}
          {taskImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {taskImages.map((image) => (
                <div key={image.id} className="relative aspect-square group">
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-2 left-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete"
                  >
                    ×
                  </button>

                  {image.mimeType === 'application/pdf' ? (
                    <div 
                      className="w-full h-full bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center cursor-pointer relative"
                      onClick={() => handleDownloadImage(image)}
                    >
                      <svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-red-800 font-medium">PDF</span>
                      
                      {/* Uploader Info - Visible on hover */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="truncate text-center">
                          {image.uploadedByName || image.uploadedBy || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={`http://localhost:8000/task-images/image/${image.filename}`}
                        alt={`Task image`}
                        className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => openFullScreenImage(image)}
                      />
                      
                      {/* Uploader Info - Visible on hover */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="truncate text-center">
                          Uploaded by: {image.uploadedByName || image.uploadedBy || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File name on hover (overwrites uploader info if both present) */}
                  <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate text-center">
                      {image.filename.length > 20 
                        ? `${image.filename.substring(0, 17)}...` 
                        : image.filename}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No files uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Image Modal with Uploader Info */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeFullScreenImage}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={() => handleDownloadImage(selectedImage)}
              className="absolute top-4 right-16 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Uploader Info in Modal */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg z-10">
              <span className="text-sm">
                Uploaded by: {selectedImage.uploadedByName || selectedImage.uploadedBy || 'Unknown'}
              </span>
            </div>

            {selectedImage.mimeType === 'application/pdf' ? (
              <div className="bg-white p-8 rounded-lg">
                <p className="text-center mb-4 font-medium">{selectedImage.filename}</p>
                <p className="text-center text-sm text-gray-600 mb-4">
                  Uploaded by: {selectedImage.uploadedByName || selectedImage.uploadedBy || 'Unknown'}
                </p>
                <button
                  onClick={() => handleDownloadImage(selectedImage)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mx-auto block"
                >
                  Download PDF
                </button>
              </div>
            ) : (
              <img
                src={`http://localhost:8000/task-images/image/${selectedImage.filename}`}
                alt="Full screen"
                className="max-w-full max-h-screen object-contain"
              />
            )}

            {/* File Info at Bottom */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <div className="text-sm">
                <div className="font-medium mb-1">{selectedImage.filename}</div>
                <div className="flex justify-between text-xs">
                  <span>Size: {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <span>Type: {selectedImage.mimeType}</span>
                  <span>Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Collapsible Section Component */
interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`px-4 pb-4 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
}

/* Readonly Field Component */
function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="text-gray-900 text-sm break-words">
        {value || '—'}
      </div>
    </div>
  );
}