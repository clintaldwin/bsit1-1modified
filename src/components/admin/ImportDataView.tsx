import React, { useState } from 'react';
import { 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  HelpCircle,
  X,
  Plus,
  BookOpen,
  Bell,
  CheckSquare,
  FileText,
  Calendar,
  FolderGit2
} from 'lucide-react';
import { 
  validateImportBatch, 
  safeParseJson 
} from '@/lib/validation/jsonValidator';
import { 
  AI_SYSTEM_PROMPT, 
  SAMPLE_BATCH_BSIT_11, 
  SAMPLE_BATCH_INVALID_DEMO 
} from '@/lib/validation/samplePrompts';
import { 
  BatchValidationResult, 
  ImportItem, 
  ValidatedItemResult 
} from '@/types/importSchema';
import { databaseRepository } from '@/lib/database/mockStore';
import { useToast } from '../common/Toast';
import { calculateDeadlineInfo, formatEventDateTime } from '@/utils/dates';
import { PriorityIndicator } from '../common/PriorityIndicator';

interface ImportDataViewProps {
  sectionId: string;
  onImportSuccess?: () => void;
}

export function ImportDataView({ sectionId, onImportSuccess }: ImportDataViewProps) {
  const { showToast } = useToast();
  const [jsonInput, setJsonInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<BatchValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Editable batch items in state once validated
  const [editableItems, setEditableItems] = useState<ValidatedItemResult[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Validate on click or automatically
  const handleValidate = () => {
    if (!jsonInput.trim()) {
      showToast('Empty JSON', 'Please paste JSON data first.', 'error');
      return;
    }
    const result = validateImportBatch(jsonInput);
    setValidationResult(result);
    setEditableItems(result.items);

    if (result.isValid) {
      showToast('Validation Passed', `${result.validCount} valid items ready for preview.`, 'success');
    } else {
      showToast('Validation Issues Detected', `${result.errorCount} item(s) or syntax issues found.`, 'error');
    }
  };

  // Load a preset template
  const handleLoadPreset = (jsonPreset: string, label: string) => {
    setJsonInput(jsonPreset);
    const result = validateImportBatch(jsonPreset);
    setValidationResult(result);
    setEditableItems(result.items);
    showToast(`Loaded ${label}`, 'JSON loaded and validated.', 'info');
  };

  // Copy external AI prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_SYSTEM_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
      showToast('Prompt Copied', 'Paste this system prompt into ChatGPT, Gemini, or Claude.', 'success');
    } catch (e) {
      showToast('Copy Failed', 'Please select and copy manually.', 'error');
    }
  };

  // Remove an item from the batch
  const handleRemoveItem = (index: number) => {
    const updated = editableItems.filter((it) => it.index !== index);
    setEditableItems(updated);
    showToast('Item Removed', `Item #${index} removed from import batch.`, 'info');
  };

  // Open Edit Modal for an item
  const handleOpenEditModal = (itemResult: ValidatedItemResult) => {
    setEditingItemIndex(itemResult.index);
    // Clone item data
    const raw = itemResult.item || itemResult.rawItem;
    setEditFormData({
      type: raw.type || 'assignment',
      source_text: raw.source_text || '',
      data: { ...(raw.data || {}) },
    });
  };

  // Save changes from Edit Modal
  const handleSaveItemEdit = () => {
    if (!editFormData || editingItemIndex === null) return;

    const updated = editableItems.map((it) => {
      if (it.index === editingItemIndex) {
        // Revalidate the single edited item
        return {
          ...it,
          item: editFormData as ImportItem,
          rawItem: editFormData,
          isValid: true,
          errors: [],
          itemType: editFormData.type,
        };
      }
      return it;
    });

    setEditableItems(updated);
    setEditingItemIndex(null);
    setEditFormData(null);
    showToast('Changes Saved', 'Item updated in the preview batch.', 'success');
  };

  // Publish to Database
  const handlePublishBatch = async () => {
    const validItems = editableItems.filter((i) => i.isValid && i.item !== null).map((i) => i.item!);

    if (validItems.length === 0) {
      showToast('Cannot Publish', 'There are no valid items to publish.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const summary = await databaseRepository.importBatch(validItems, sectionId, 'Section Admin');
      showToast(
        'Batch Published Successfully!',
        `${summary.insertedCount} items published directly to Section Lobby database.`,
        'success'
      );
      // Clear or reset preview
      setEditableItems([]);
      setValidationResult(null);
      setJsonInput('');
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      showToast('Publish Failed', err.message || 'An error occurred while writing to database.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'announcement': return <Bell className="w-4 h-4 text-rose-600" />;
      case 'task': return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'note': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'event': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'resource': return <FolderGit2 className="w-4 h-4 text-neutral-600" />;
      default: return <FileCode2 className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12">
      
      {/* Top Banner & AI Integration Notice */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <h1 className="text-lg font-bold tracking-tight text-neutral-900 uppercase">
                JSON Import System
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
              Section Lobby uses a strict Version 1.0 JSON schema contract. Paste JSON output from external AI (ChatGPT, Gemini, Claude). The system parses, validates, displays errors, lets you preview and edit before publishing to the database.
            </p>
          </div>

          {/* Action to view AI system prompt */}
          <button
            onClick={() => setShowPromptModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors shrink-0 border border-neutral-300/80"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Prompt Template</span>
          </button>
        </div>

        {/* Preset loaders */}
        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-neutral-400 mr-1">Optional Testing Templates:</span>
          <button
            onClick={() => handleLoadPreset(SAMPLE_BATCH_BSIT_11, 'BSIT 1-1 Test Batch')}
            className="px-2.5 py-1 text-xs bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md transition-colors"
          >
            Load BSIT 1-1 Test Batch
          </button>
          <button
            onClick={() => handleLoadPreset(SAMPLE_BATCH_INVALID_DEMO, 'Error Demo Batch')}
            className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md transition-colors"
          >
            Test Invalid Error Handling
          </button>
        </div>
      </div>

      {/* Editor & Validation Action Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: JSON Textarea */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                  Pasted JSON Payload
                </span>
              </div>
              <button
                onClick={() => setJsonInput('')}
                className="text-xs text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste Version 1.0 JSON here..."
              className="flex-1 w-full mt-3 p-3 text-xs font-mono bg-neutral-900 text-neutral-100 rounded-xl resize-none outline-hidden border border-neutral-800 focus:border-neutral-600 leading-relaxed tabular-nums"
              spellCheck={false}
            />

            <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">
                {jsonInput.length} chars
              </span>
              <button
                onClick={handleValidate}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Validate JSON Batch</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Validation Diagnostics */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs h-[520px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                  Validation Diagnostic
                </span>
                {validationResult && (
                  <span className={`text-xs font-mono font-medium ${validationResult.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {validationResult.isValid ? 'Schema Validated (Ready)' : `${validationResult.errorCount} Error(s)`}
                  </span>
                )}
              </div>

              {!validationResult ? (
                <div className="py-20 text-center text-xs text-neutral-400">
                  <FileCode2 className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p>Click "Validate JSON Batch" to check data structure.</p>
                </div>
              ) : (
                <div className="mt-3 overflow-y-auto max-h-[380px] space-y-3 pr-1">
                  
                  {/* Global or Syntax Errors */}
                  {validationResult.globalErrors.length > 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Syntax or Envelope Error:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                        {validationResult.globalErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                      <span className="text-[10px] text-neutral-400 uppercase block">Total Items</span>
                      <span className="text-base font-bold text-neutral-900">{validationResult.totalCount}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-600 uppercase block">Valid Items</span>
                      <span className="text-base font-bold text-emerald-800">{validationResult.validCount}</span>
                    </div>
                    <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                      <span className="text-[10px] text-rose-600 uppercase block">Invalid Items</span>
                      <span className="text-base font-bold text-rose-800">{validationResult.errorCount}</span>
                    </div>
                  </div>

                  {/* Detailed Per-Item Error Log */}
                  {validationResult.items.filter((i) => !i.isValid).map((itemErr) => (
                    <div key={itemErr.index} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs">
                      <div className="flex items-center justify-between text-rose-900 font-semibold mb-1">
                        <span>Item #{itemErr.index} ({itemErr.itemType})</span>
                        <span className="text-[10px] font-mono text-rose-600 uppercase">Rejected</span>
                      </div>
                      <div className="space-y-1 text-rose-800 font-mono text-[11px]">
                        {itemErr.errors.map((e, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-500">•</span>
                            <span><strong>{e.field}</strong>: {e.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {validationResult.isValid && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-900">All {validationResult.validCount} items passed schema validation!</p>
                        <p className="text-emerald-700 mt-0.5">
                          Review the detected items below. You can edit any field or reject individual items before publishing to the database.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Quick guidance note */}
            <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-400 font-mono">
              Schema version: 1.0 · Strict type contract enforced
            </div>
          </div>
        </div>

      </div>

      {/* IMPORT PREVIEW & PUBLISH WORKFLOW SECTION */}
      {editableItems.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-neutral-400">Step 2</span>
                <h3 className="text-base font-bold text-neutral-900">
                  Import Preview ({editableItems.length} items detected)
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review items, edit details, or remove unwanted records before publishing to PostgreSQL.
              </p>
            </div>

            {/* Publish Batch Button */}
            <button
              onClick={handlePublishBatch}
              disabled={isProcessing || editableItems.filter((i) => i.isValid).length === 0}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Valid Items ({editableItems.filter((i) => i.isValid).length})</span>
            </button>
          </div>

          {/* Cards for each item */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableItems.map((itemResult) => {
              const item = itemResult.item;
              const raw = itemResult.rawItem;
              const data = item?.data || raw?.data || {};
              const isValid = itemResult.isValid;

              const deadline = data.due_at ? calculateDeadlineInfo(data.due_at) : null;

              return (
                <div
                  key={itemResult.index}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isValid
                      ? 'bg-neutral-50/50 border-neutral-200 hover:border-neutral-300'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(itemResult.itemType)}
                        <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">
                          #{itemResult.index} · {itemResult.itemType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {data.priority && <PriorityIndicator priority={data.priority} />}
                        <button
                          onClick={() => handleRemoveItem(itemResult.index)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors rounded-md"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subject if assignment */}
                    {data.subject && (
                      <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                        {data.subject}
                      </span>
                    )}

                    {/* Title */}
                    <h4 className="text-xs font-semibold text-neutral-900 line-clamp-1 mb-1">
                      {data.title || 'Untitled Item'}
                    </h4>

                    {/* Description / Content */}
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {data.description || data.content || 'No details provided.'}
                    </p>

                    {/* Dates & Location */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-2 font-mono">
                      {deadline && (
                        <span>
                          Due: <strong className="font-semibold text-neutral-700">{deadline.relativeLabel}</strong>
                        </span>
                      )}
                      {data.starts_at && (
                        <span>
                          Starts: {formatEventDateTime(data.starts_at, data.ends_at)}
                        </span>
                      )}
                      {data.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{data.location}</span>
                        </>
                      )}
                      {data.assigned_to && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Assigned: {data.assigned_to}</span>
                        </>
                      )}
                    </div>

                    {/* Preserved Raw Source Excerpt */}
                    {(item?.source_text || raw?.source_text) && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500 italic font-mono truncate">
                        Source: "{item?.source_text || raw?.source_text}"
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-neutral-200/60 flex items-center justify-between">
                    <div>
                      {!isValid && (
                        <span className="text-[11px] text-rose-600 font-semibold font-mono">
                          Fix errors to publish
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenEditModal(itemResult)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-950 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Item</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* EDIT MODAL FOR AN INDIVIDUAL ITEM BEFORE PUBLISHING */}
      {editingItemIndex !== null && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                Edit Item #{editingItemIndex} ({editFormData.type})
              </h3>
              <button
                onClick={() => setEditingItemIndex(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editFormData.data.title || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      data: { ...editFormData.data, title: e.target.value },
                    })
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900"
                />
              </div>

              {/* Subject if applicable */}
              {(editFormData.type === 'assignment' || editFormData.type === 'note') && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Subject / Course
                  </label>
                  <input
                    type="text"
                    value={editFormData.data.subject || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        data: { ...editFormData.data, subject: e.target.value },
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900"
                  />
                </div>
              )}

              {/* Due Date if applicable */}
              {(editFormData.type === 'assignment' || editFormData.type === 'task') && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Due Date & Time (ISO 8601 or YYYY-MM-DDTHH:MM)
                  </label>
                  <input
                    type="text"
                    value={editFormData.data.due_at || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        data: { ...editFormData.data, due_at: e.target.value },
                      })
                    }
                    placeholder="2026-10-02T23:59:00+08:00"
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900"
                  />
                </div>
              )}

              {/* Starts At if Event */}
              {editFormData.type === 'event' && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Starts At (ISO 8601)
                  </label>
                  <input
                    type="text"
                    value={editFormData.data.starts_at || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        data: { ...editFormData.data, starts_at: e.target.value },
                      })
                    }
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900"
                  />
                </div>
              )}

              {/* Priority */}
              {editFormData.data.priority !== undefined && (
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Priority
                  </label>
                  <select
                    value={editFormData.data.priority || 'normal'}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        data: { ...editFormData.data, priority: e.target.value },
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              )}

              {/* Description / Content */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Description / Content
                </label>
                <textarea
                  rows={4}
                  value={editFormData.data.description || editFormData.data.content || ''}
                  onChange={(e) => {
                    const key = editFormData.type === 'note' || editFormData.type === 'announcement' ? 'content' : 'description';
                    setEditFormData({
                      ...editFormData,
                      data: { ...editFormData.data, [key]: e.target.value },
                    });
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900"
                />
              </div>

              {/* Source Text Snippet */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Preserved Source Snippet
                </label>
                <input
                  type="text"
                  value={editFormData.source_text || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      source_text: e.target.value,
                    })
                  }
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-neutral-300 outline-hidden focus:border-neutral-900 text-neutral-600"
                />
              </div>

            </div>

            <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingItemIndex(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItemEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
              >
                Save Item Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI SYSTEM PROMPT MODAL */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-neutral-900">
                  External AI System Prompt (Version 1.0)
                </h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              <p className="text-xs text-neutral-600 leading-relaxed">
                Copy this prompt and paste it into ChatGPT, Claude, Gemini, or any LLM alongside your messy group chat screenshots or copied text. The AI will output structured JSON ready to be pasted directly into this import screen.
              </p>

              <pre className="p-4 bg-neutral-900 text-neutral-100 text-[11px] font-mono rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {AI_SYSTEM_PROMPT}
              </pre>
            </div>

            <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">
                No paid AI keys required · 100% human-supervised import
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
