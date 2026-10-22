'use client';

import React, { useState } from 'react';
import { reportQuestion } from '@/lib/api';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Props {
  questionId: string;
  questionNumber?: number;
  onClose: () => void;
}

const REASONS = [
  { id: 'typo', label: 'Lỗi chính tả / văn bản (Typo or text error)' },
  { id: 'wrong_answer', label: 'Đáp án hoặc lời giải sai (Wrong answer / explanation)' },
  { id: 'broken_image', label: 'Hình ảnh / biểu đồ bị lỗi (Broken diagram or image)' },
  { id: 'formatting', label: 'Lỗi định dạng / công thức toán (Math formula / formatting error)' },
  { id: 'other', label: 'Vấn đề khác (Other issue)' },
];

export default function ReportQuestionModal({ questionId, questionNumber, onClose }: Props) {
  const [reason, setReason] = useState(REASONS[0].id);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    try {
      await reportQuestion({
        questionId,
        reason,
        description: description.trim(),
        studentName: typeof window !== 'undefined' ? localStorage.getItem('sat_player_name') || 'Anonymous' : 'Anonymous',
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Không thể gửi báo cáo lúc này.');
    }
  };

  return (
    <div className="bb-modal-backdrop" role="dialog" aria-modal="true">
      <div className="bb-modal max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          type="button"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="text-amber-500" size={22} />
          <h2 className="text-lg font-bold">
            Báo lỗi câu hỏi {questionNumber ? `#${questionNumber}` : ''}
          </h2>
        </div>

        {status === 'success' ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto text-green-500 mb-2" size={44} />
            <h3 className="text-base font-semibold text-green-600">Báo cáo đã được ghi nhận!</h3>
            <p className="text-sm text-gray-500 mt-1">Cảm ơn bạn đã đóng góp giúp hoàn thiện đề thi.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-neutral-800 p-2 rounded border border-gray-200 dark:border-neutral-700">
              ID câu hỏi: <span className="font-semibold text-gray-700 dark:text-gray-200">{questionId}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Loại vấn đề
              </label>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2.5 p-2 rounded text-sm cursor-pointer border transition-colors ${
                      reason === r.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="accent-blue-600"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Mô tả chi tiết (tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Đoạn văn thiếu dấu phẩy ở dòng 3, hoặc đáp án B giải thích chưa chuẩn..."
                className="w-full text-sm p-2.5 rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                {errorMessage}
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                className="bb-secondary !py-2 !px-4 text-sm"
                onClick={onClose}
                disabled={status === 'sending'}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bb-primary !py-2 !px-5 text-sm"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
