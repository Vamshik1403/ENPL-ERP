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
}

interface Site {
  id: number;
  siteID: string;
  siteName: string;
  addressBookId: number;
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

interface Task {
  id?: number;
  taskID: string;
  departmentId: number;
  addressBookId: number;
  siteId: number;
  status: string;
  department?: string;
  customer?: string;
  site?: string;
  addressBook?: string;
  workscopeCat?: string;
  createdBy: string;
  createdAt: string;
  contacts?: TasksContacts[];
  workscopeDetails?: TasksWorkscopeDetails[];
  schedule?: TasksSchedule[];
  remarks?: TasksRemarks[];
}

export default function ViewTaskPage() {
  const { id } = useParams();
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
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    basicInfo: false,
    taskContacts: false,
    workscopeDetails: false,
    schedule: false,
    remarks: false,
  });

  // Fix hydration by ensuring this only runs on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && id) {
      fetchTaskData();
    }
  }, [id, isClient]);

  const fetchTaskData = async () => {
  try {
    setLoading(true);
    
    // Decode the URL-encoded parameter
    const decodedTaskId = decodeURIComponent(id as string);
    console.log('Decoded task ID:', decodedTaskId);
    
    // Fetch all tasks and find the one with matching taskID
    const tasksRes = await fetch('http://localhost:8000/task');
    
    if (!tasksRes.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const allTasks = await tasksRes.json();
    const taskData = allTasks.find((task: Task) => task.taskID === decodedTaskId);
    
    if (!taskData) {
      throw new Error(`Task with ID "${decodedTaskId}" not found. Available tasks: ${allTasks.map((t: Task) => t.taskID).join(', ')}`);
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
  if (!files || files.length === 0 || !task) return;

  try {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    // Use the actual numeric task ID for image upload
    const response = await fetch(`http://localhost:8000/task-images/${task.id}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload images');

    await fetchTaskData();
    event.target.value = '';
    
  } catch (err) {
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

      // Remove from local state
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized container with minimal padding */}
      <div className="w-full max-w-full">
        {/* Header - Mobile optimized */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Task Details</h1>
          <p className="text-gray-600 text-sm">Task ID: {task.taskID}</p>
        </div>

       

        {/* Basic Information - Collapsible Section */}
        <CollapsibleSection
          title="Task Basic Information"
          isOpen={openSections.basicInfo}
          onToggle={() => toggleSection('basicInfo')}
        >
          <div className="grid grid-cols-1 gap-3">
            <ReadonlyField label="Task ID" value={task.taskID} />
            <ReadonlyField label="Status" value={task.status} />
            <ReadonlyField label="Department" value={getDepartmentName(task.departmentId)} />
            <ReadonlyField label="Customer" value={getCustomerName(task.addressBookId)} />
            <ReadonlyField label="Site" value={getSiteName(task.siteId)} />
            <ReadonlyField label="Created By" value={task.createdBy} />
            <ReadonlyField
              label="Created At"
              value={new Date(task.createdAt).toLocaleString()}
            />
          </div>
        </CollapsibleSection>

        {/* Task Contacts - Collapsible Section */}
        {task.contacts && task.contacts.length > 0 && (
          <CollapsibleSection
            title="Task Contacts"
            isOpen={openSections.taskContacts}
            onToggle={() => toggleSection('taskContacts')}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Contact Name</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Contact Number</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Contact Email</th>
                  </tr>
                </thead>
                <tbody>
                  {task.contacts.map((contact, index) => (
                    <tr key={contact.id || index} className="border-t border-blue-100 hover:bg-gray-50">
                      <td className="p-3 border border-blue-100 text-gray-700 whitespace-nowrap">{contact.contactName}</td>
                      <td className="p-3 border border-blue-100 text-gray-700 whitespace-nowrap">{contact.contactNumber}</td>
                      <td className="p-3 border border-blue-100 text-gray-700 whitespace-nowrap">{contact.contactEmail || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Workscope Details - Collapsible Section */}
        {task.workscopeDetails && task.workscopeDetails.length > 0 && (
          <CollapsibleSection
            title="Workscope Details"
            isOpen={openSections.workscopeDetails}
            onToggle={() => toggleSection('workscopeDetails')}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Category</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {task.workscopeDetails.map((workscope, index) => (
                    <tr key={workscope.id || index} className="border-t border-blue-100 hover:bg-gray-50">
                      <td className="p-3 border border-blue-100 text-gray-700 whitespace-nowrap">
                        {getWorkscopeCategoryName(workscope.workscopeCategoryId)}
                      </td>
                      <td className="p-3 border border-blue-100 text-gray-700">{workscope.workscopeDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Schedule - Collapsible Section */}
        {task.schedule && task.schedule.length > 0 && (
          <CollapsibleSection
            title="Schedule"
            isOpen={openSections.schedule}
            onToggle={() => toggleSection('schedule')}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Proposed Date & Time</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border border-blue-100 whitespace-nowrap">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {task.schedule.map((schedule, index) => (
                    <tr key={schedule.id || index} className="border-t border-blue-100 hover:bg-gray-50">
                      <td className="p-3 border border-blue-100 text-gray-700 whitespace-nowrap">
                        {new Date(schedule.proposedDateTime).toLocaleString()}
                      </td>
                      <td className="p-3 border border-blue-100 text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${schedule.priority === 'High' || schedule.priority === 'Urgent'
                            ? 'bg-red-100 text-red-800'
                            : schedule.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                          {schedule.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Remarks History - Collapsible Section */}
        {task.remarks && task.remarks.length > 0 && (
          <CollapsibleSection
            title="Remarks History"
            isOpen={openSections.remarks}
            onToggle={() => toggleSection('remarks')}
          >
            <div className="space-y-3">
              {[...task.remarks].reverse().map((remark, index) => (
                <div key={remark.id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${remark.status === 'Closed' ? 'bg-green-100 text-green-800' :
                        remark.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                          remark.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {remark.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(remark.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2 text-sm">{remark.remark}</p>
                  <div className="text-xs text-gray-500">
                    Added by {remark.createdBy}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          
        )}

         {/* Image Upload Section - Mobile First Design */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold text-gray-900">Service Reports & Documents</h2>
    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
      {taskImages.length} files
    </span>
  </div>
          
          {/* Upload Button - Full width on mobile */}
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

          {/* Images Grid - Mobile optimized */}
        {/* Images Grid - Mobile optimized */}
{taskImages.length > 0 ? (
  <div className="grid grid-cols-3 gap-2">
    {taskImages.map((image) => (
      <div key={image.id} className="relative aspect-square group">
        {/* Delete Button - Top Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteImage(image.id);
          }}
          className="absolute top-1 left-1 bg-red-600 text-black rounded-full w-6 h-6 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity text-xs shadow-lg z-10"
          title="Delete file"
        >
          ×
        </button>

        {/* File Type Indicator */}
        <div className="absolute top-1 right-1 flex flex-col gap-1">
          {image.mimeType === 'application/pdf' ? (
            <div className="bg-red-600 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              PDF
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage(image);
              }}
              className="bg-blue-600 text-black rounded-full w-6 h-6 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity text-xs shadow-lg"
              title="Download file"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
        </div>

        {/* File Preview */}
        {image.mimeType === 'application/pdf' ? (
          <div 
            className="w-full h-full bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center cursor-pointer p-2"
            onClick={() => handleDownloadImage(image)}
          >
            <svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-red-800 font-medium text-center break-words">
              PDF Document
            </span>
          </div>
        ) : (
          <>
            <img
              src={`http://localhost:8000/task-images/image/${image.filename}`}
              alt={`Task image ${image.id}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer"
              onClick={() => openFullScreenImage(image)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFullScreenImage(image);
                }}
                className="bg-white bg-opacity-90 rounded-full p-1 mx-1 hover:bg-opacity-100 transition-all"
                title="View full screen"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* File Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
          <div className="truncate">
            {image.filename.length > 15 
              ? `${image.filename.substring(0, 12)}...${image.filename.split('.').pop()}`
              : image.filename
            }
          </div>
          <div className="flex justify-between text-xs opacity-75">
            <span>{new Date(image.uploadedAt).toLocaleDateString()}</span>
            <span>{(image.fileSize / 1024 / 1024).toFixed(1)}MB</span>
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

      {/* Full Screen Image Modal */}
    {/* Full Screen File Modal */}
{selectedImage && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
    <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={closeFullScreenImage}
        className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Download Button */}
      <button
        onClick={() => handleDownloadImage(selectedImage)}
        className="absolute top-4 right-16 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-all"
        title="Download file"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      {/* File Content */}
      {selectedImage.mimeType === 'application/pdf' ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="bg-red-50 border-4 border-red-200 rounded-lg p-8 max-w-md text-center">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-red-800 mb-2">PDF Document</h3>
            <p className="text-red-700 mb-4">{selectedImage.filename}</p>
            <button
              onClick={() => handleDownloadImage(selectedImage)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      ) : (
        <img
          src={`http://localhost:8000/task-images/image/${selectedImage.filename}`}
          alt={`Task image ${selectedImage.id}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      )}

      {/* File Info */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
        <div className="text-sm">
          <div className="font-medium truncate">{selectedImage.filename}</div>
          <div className="flex justify-between text-xs opacity-75 mt-1">
            <span>Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}</span>
            <span>Size: {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="text-xs opacity-75 mt-1">Type: {selectedImage.mimeType}</div>
        </div>
      </div>

      {/* Navigation Arrows if multiple files and it's an image */}
      {taskImages.length > 1 && selectedImage.mimeType.startsWith('image/') && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = taskImages.findIndex(img => img.id === selectedImage.id);
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : taskImages.length - 1;
              setSelectedImage(taskImages[prevIndex]);
            }}
            className="absolute left-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = taskImages.findIndex(img => img.id === selectedImage.id);
              const nextIndex = currentIndex < taskImages.length - 1 ? currentIndex + 1 : 0;
              setSelectedImage(taskImages[nextIndex]);
            }}
            className="absolute right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  </div>
)}
    </div>
  );
}

/* 🔹 Collapsible Section Component */
interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Section Header */}
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

      {/* Section Content */}
      <div className={`px-4 pb-4 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
}

/* 🔹 Mobile-optimized Helper Component */
function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="text-gray-900 text-sm">
        {value || '—'}
      </div>
    </div>
  );
}