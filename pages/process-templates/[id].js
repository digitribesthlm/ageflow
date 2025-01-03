import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function ProcessTemplateDetails() {
  const router = useRouter()
  const { id } = router.query
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedTemplate, setEditedTemplate] = useState(null)

  useEffect(() => {
    if (id) {
      fetchTemplateDetails()
    }
  }, [id])

  const fetchTemplateDetails = async () => {
    try {
      const response = await fetch('/api/process-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch_details',
          template_id: id
        }),
      })
      
      if (!response.ok) throw new Error('Failed to fetch template')
      const data = await response.json()
      setTemplate(data)
      setEditedTemplate(data)
    } catch (error) {
      console.error('Error fetching template details:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/process-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          template: editedTemplate
        }),
      })

      if (!response.ok) throw new Error('Failed to update template')
      await fetchTemplateDetails()
      setEditMode(false)
    } catch (error) {
      console.error('Error updating template:', error)
      setError(error.message)
    }
  }

  const updateStep = (stepIndex, field, value) => {
    const updatedTemplate = { ...editedTemplate }
    updatedTemplate.steps[stepIndex][field] = value
    setEditedTemplate(updatedTemplate)
  }

  const updateTask = (stepIndex, taskIndex, field, value) => {
    const updatedTemplate = { ...editedTemplate }
    updatedTemplate.steps[stepIndex].tasks[taskIndex][field] = value
    setEditedTemplate(updatedTemplate)
  }

  const updateSubTask = (stepIndex, taskIndex, subTaskIndex, field, value) => {
    const updatedTemplate = { ...editedTemplate }
    updatedTemplate.steps[stepIndex].tasks[taskIndex].sub_tasks[subTaskIndex][field] = value
    setEditedTemplate(updatedTemplate)
  }

  const renderContent = () => {
    const templateData = editMode ? editedTemplate : template

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{templateData.name}</h1>
            <div className="mt-2 space-x-2">
              <span className="badge badge-outline">{templateData.category}</span>
              <span className="badge badge-outline">Version {templateData.version}</span>
            </div>
          </div>
          <div>
            {editMode ? (
              <div className="space-x-2">
                <button 
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                <button 
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditedTemplate(template)
                    setEditMode(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => setEditMode(true)}
              >
                Edit Template
              </button>
            )}
          </div>
        </div>

        <div className="divider"></div>

        {/* Steps */}
        <div className="space-y-8">
          {templateData.steps.map((step, stepIndex) => (
            <div key={step.step_id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title">
                      {editMode ? (
                        <input
                          type="text"
                          className="input input-bordered"
                          value={step.name}
                          onChange={(e) => updateStep(stepIndex, 'name', e.target.value)}
                        />
                      ) : (
                        step.name
                      )}
                    </h2>
                    <p className="text-sm text-base-content/70">Step {step.order}</p>
                  </div>
                </div>

                {/* Tasks */}
                <div className="mt-4 space-y-4">
                  {step.tasks.map((task, taskIndex) => (
                    <div key={task.task_template_id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">
                          {editMode ? (
                            <input
                              type="text"
                              className="input input-bordered w-full"
                              value={task.name}
                              onChange={(e) => updateTask(stepIndex, taskIndex, 'name', e.target.value)}
                            />
                          ) : (
                            task.name
                          )}
                        </h3>
                        
                        <div className="text-sm text-base-content/70">
                          {editMode ? (
                            <textarea
                              className="textarea textarea-bordered w-full"
                              value={task.description}
                              onChange={(e) => updateTask(stepIndex, taskIndex, 'description', e.target.value)}
                            />
                          ) : (
                            task.description
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Estimated Hours</p>
                            {editMode ? (
                              <input
                                type="number"
                                className="input input-bordered w-full"
                                value={task.estimated_hours}
                                onChange={(e) => updateTask(stepIndex, taskIndex, 'estimated_hours', parseInt(e.target.value))}
                              />
                            ) : (
                              <p className="text-base-content/70">{task.estimated_hours}</p>
                            )}
                          </div>
                        </div>

                        {task.required_tools && (
                          <div>
                            <p className="text-sm font-medium">Required Tools</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {task.required_tools.map((tool, index) => (
                                <div key={index} className="badge badge-outline">
                                  {editMode ? (
                                    <input
                                      type="text"
                                      className="input input-xs input-bordered w-24"
                                      value={tool}
                                      onChange={(e) => {
                                        const updatedTools = [...task.required_tools]
                                        updatedTools[index] = e.target.value
                                        updateTask(stepIndex, taskIndex, 'required_tools', updatedTools)
                                      }}
                                    />
                                  ) : (
                                    tool
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {task.deliverables && (
                          <div>
                            <p className="text-sm font-medium">Deliverables</p>
                            <ul className="list-disc list-inside space-y-1 text-base-content/70">
                              {task.deliverables.map((deliverable, index) => (
                                <li key={index}>
                                  {editMode ? (
                                    <input
                                      type="text"
                                      className="input input-bordered input-sm ml-2"
                                      value={deliverable}
                                      onChange={(e) => {
                                        const updatedDeliverables = [...task.deliverables]
                                        updatedDeliverables[index] = e.target.value
                                        updateTask(stepIndex, taskIndex, 'deliverables', updatedDeliverables)
                                      }}
                                    />
                                  ) : (
                                    deliverable
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {task.instruction_doc && (
                          <div>
                            <p className="text-sm font-medium">Instructions Document</p>
                            {editMode ? (
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  className="input input-bordered input-sm"
                                  value={task.instruction_doc.title}
                                  onChange={(e) => updateTask(stepIndex, taskIndex, 'instruction_doc', {
                                    ...task.instruction_doc,
                                    title: e.target.value
                                  })}
                                  placeholder="Document Title"
                                />
                                <input
                                  type="text"
                                  className="input input-bordered input-sm"
                                  value={task.instruction_doc.url}
                                  onChange={(e) => updateTask(stepIndex, taskIndex, 'instruction_doc', {
                                    ...task.instruction_doc,
                                    url: e.target.value
                                  })}
                                  placeholder="Document URL"
                                />
                              </div>
                            ) : (
                              <a 
                                href={task.instruction_doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary text-sm"
                              >
                                {task.instruction_doc.title}
                              </a>
                            )}
                          </div>
                        )}

                        {/* Sub-tasks */}
                        {task.sub_tasks && task.sub_tasks.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Sub-tasks</p>
                            <div className="space-y-2 pl-4">
                              {task.sub_tasks.map((subTask, subTaskIndex) => (
                                <div key={subTask.sub_task_template_id} className="border-l-2 pl-4">
                                  <h4 className="font-medium">
                                    {editMode ? (
                                      <input
                                        type="text"
                                        className="input input-bordered input-sm"
                                        value={subTask.name}
                                        onChange={(e) => updateSubTask(stepIndex, taskIndex, subTaskIndex, 'name', e.target.value)}
                                      />
                                    ) : (
                                      subTask.name
                                    )}
                                  </h4>
                                  <p className="text-sm text-base-content/70">
                                    {editMode ? (
                                      <textarea
                                        className="textarea textarea-bordered textarea-sm w-full"
                                        value={subTask.description}
                                        onChange={(e) => updateSubTask(stepIndex, taskIndex, subTaskIndex, 'description', e.target.value)}
                                      />
                                    ) : (
                                      subTask.description
                                    )}
                                  </p>
                                  {subTask.instruction_doc && (
                                    <a 
                                      href={subTask.instruction_doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="link link-primary text-sm"
                                    >
                                      {subTask.instruction_doc.title}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !template) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="alert alert-error">
            {error || 'Template not found'}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Process Template Details"
        breadcrumbs={[
          { label: 'Process Templates', href: '/process-templates' },
          { label: template.name, href: `/process-templates/${id}` }
        ]}
      />
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </DashboardLayout>
  )
} 