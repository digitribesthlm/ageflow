import { useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import PageHeader from '../../components/PageHeader'
import ContentContainer from '../../components/ContentContainer'

export default function NewProcessTemplate() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [template, setTemplate] = useState({
    name: '',
    category: '',
    version: '1.0',
    description: '',
    steps: [
      {
        step_id: 'step_1',
        name: 'Planning',
        order: 1,
        tasks: [
          {
            task_template_id: 'task_1_1',
            name: 'Initial Setup',
            description: '',
            estimated_hours: 2,
            required_tools: [],
            deliverables: [],
            instruction_doc: {
              title: '',
              url: ''
            }
          }
        ]
      }
    ]
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const templateToSave = {
        ...template,
        template_id: `TPL${Date.now()}`,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }

      const response = await fetch('/api/process-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          template: templateToSave
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      router.push('/process-templates')
    } catch (error) {
      console.error('Error creating template:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    const newStepId = `step_${template.steps.length + 1}`
    setTemplate({
      ...template,
      steps: [
        ...template.steps,
        {
          step_id: newStepId,
          name: 'New Step',
          order: template.steps.length + 1,
          tasks: [
            {
              task_template_id: `${newStepId}_task_1`,
              name: 'New Task',
              description: '',
              estimated_hours: 1,
              required_tools: [],
              deliverables: [],
              instruction_doc: {
                title: '',
                url: ''
              }
            }
          ]
        }
      ]
    })
  }

  const addTask = (stepIndex) => {
    const newTemplate = { ...template }
    const step = newTemplate.steps[stepIndex]
    const newTaskId = `${step.step_id}_task_${step.tasks.length + 1}`
    
    step.tasks.push({
      task_template_id: newTaskId,
      name: 'New Task',
      description: '',
      estimated_hours: 1,
      required_tools: [],
      deliverables: [],
      instruction_doc: {
        title: '',
        url: ''
      }
    })

    setTemplate(newTemplate)
  }

  const updateStep = (stepIndex, field, value) => {
    const newTemplate = { ...template }
    newTemplate.steps[stepIndex][field] = value
    setTemplate(newTemplate)
  }

  const updateTask = (stepIndex, taskIndex, field, value) => {
    const newTemplate = { ...template }
    newTemplate.steps[stepIndex].tasks[taskIndex][field] = value
    setTemplate(newTemplate)
  }

  const addTool = (stepIndex, taskIndex) => {
    const newTemplate = { ...template }
    newTemplate.steps[stepIndex].tasks[taskIndex].required_tools.push('')
    setTemplate(newTemplate)
  }

  const updateTool = (stepIndex, taskIndex, toolIndex, value) => {
    const newTemplate = { ...template }
    newTemplate.steps[stepIndex].tasks[taskIndex].required_tools[toolIndex] = value
    setTemplate(newTemplate)
  }

  const addDeliverable = (stepIndex, taskIndex) => {
    const newTemplate = { ...template }
    newTemplate.steps[stepIndex].tasks[taskIndex].deliverables.push('')
    setTemplate(newTemplate)
  }

  const updateDeliverable = (stepIndex, taskIndex, deliverableIndex, value) => {
    const newTemplate = { ...template }
    newTemplate.steps[stepIndex].tasks[taskIndex].deliverables[deliverableIndex] = value
    setTemplate(newTemplate)
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="New Process Template"
        breadcrumbs={[
          { label: 'Process Templates', href: '/process-templates' },
          { label: 'New Template', href: '/process-templates/new' }
        ]}
      />
      <ContentContainer>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Template Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={template.category}
                onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Version</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={template.version}
                onChange={(e) => setTemplate({ ...template, version: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              />
            </div>
          </div>

          <div className="divider"></div>

          {/* Steps */}
          <div className="space-y-8">
            {template.steps.map((step, stepIndex) => (
              <div key={step.step_id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Step Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={step.name}
                        onChange={(e) => updateStep(stepIndex, 'name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="mt-4 space-y-4">
                    {step.tasks.map((task, taskIndex) => (
                      <div key={task.task_template_id} className="border rounded-lg p-4">
                        <div className="space-y-4">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Task Name</span>
                            </label>
                            <input
                              type="text"
                              className="input input-bordered"
                              value={task.name}
                              onChange={(e) => updateTask(stepIndex, taskIndex, 'name', e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Description</span>
                            </label>
                            <textarea
                              className="textarea textarea-bordered"
                              value={task.description}
                              onChange={(e) => updateTask(stepIndex, taskIndex, 'description', e.target.value)}
                            />
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Estimated Hours</span>
                            </label>
                            <input
                              type="number"
                              className="input input-bordered"
                              value={task.estimated_hours}
                              onChange={(e) => updateTask(stepIndex, taskIndex, 'estimated_hours', parseInt(e.target.value))}
                              required
                            />
                          </div>

                          {/* Required Tools */}
                          <div>
                            <label className="label">
                              <span className="label-text">Required Tools</span>
                            </label>
                            <div className="space-y-2">
                              {task.required_tools.map((tool, toolIndex) => (
                                <input
                                  key={toolIndex}
                                  type="text"
                                  className="input input-bordered w-full"
                                  value={tool}
                                  onChange={(e) => updateTool(stepIndex, taskIndex, toolIndex, e.target.value)}
                                />
                              ))}
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => addTool(stepIndex, taskIndex)}
                              >
                                Add Tool
                              </button>
                            </div>
                          </div>

                          {/* Deliverables */}
                          <div>
                            <label className="label">
                              <span className="label-text">Deliverables</span>
                            </label>
                            <div className="space-y-2">
                              {task.deliverables.map((deliverable, deliverableIndex) => (
                                <input
                                  key={deliverableIndex}
                                  type="text"
                                  className="input input-bordered w-full"
                                  value={deliverable}
                                  onChange={(e) => updateDeliverable(stepIndex, taskIndex, deliverableIndex, e.target.value)}
                                />
                              ))}
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => addDeliverable(stepIndex, taskIndex)}
                              >
                                Add Deliverable
                              </button>
                            </div>
                          </div>

                          {/* Instructions Document */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text">Instructions Document Title</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered"
                                value={task.instruction_doc.title}
                                onChange={(e) => updateTask(stepIndex, taskIndex, 'instruction_doc', {
                                  ...task.instruction_doc,
                                  title: e.target.value
                                })}
                              />
                            </div>
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text">Instructions Document URL</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered"
                                value={task.instruction_doc.url}
                                onChange={(e) => updateTask(stepIndex, taskIndex, 'instruction_doc', {
                                  ...task.instruction_doc,
                                  url: e.target.value
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => addTask(stepIndex)}
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={addStep}
            >
              Add Step
            </button>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.push('/process-templates')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Create Template'
              )}
            </button>
          </div>
        </form>
      </ContentContainer>
    </DashboardLayout>
  )
} 