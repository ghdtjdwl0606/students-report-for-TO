
import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { EvaluationResult, Question, StudentInput, SectionConfig } from '../types';
import { TEST_COMMENTS, GRAMMAR_TEST_TYPES, ALL_TEST_TYPES } from '../constants/testComments';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import LZString from 'lz-string';

const COLOR_MAP = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600'
];

interface Props {
  sections: SectionConfig[];
  questions: Question[];
  studentInput: StudentInput;
  onReset: () => void;
  isShared?: boolean;
}

const ReportView: React.FC<Props> = ({ sections, questions, studentInput, onReset, isShared }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const reportRef = useRef<HTMLDivElement>(null);

  const result = React.useMemo(() => {
    if (!studentInput || !sections || !questions) return null;

    const isCorrect: Record<string, boolean> = {};
    const rawScoreBySection: Record<string, number> = {};
    const rawMaxScoreBySection: Record<string, number> = {};
    const categoriesMap: Record<string, { category: string; total: number; correct: number; sectionName: string }> = {};

    sections.forEach(s => {
      rawScoreBySection[s.id] = 0;
      rawMaxScoreBySection[s.id] = 0;
    });

    questions.forEach(q => {
      const studentAns = (studentInput.answers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      const correct = studentAns !== '' && studentAns === correctAns;
      
      isCorrect[q.id] = correct;
      rawMaxScoreBySection[q.sectionId] = (rawMaxScoreBySection[q.sectionId] || 0) + q.points;
      
      if (correct) {
        rawScoreBySection[q.sectionId] = (rawScoreBySection[q.sectionId] || 0) + q.points;
      }

      const section = sections.find(s => s.id === q.sectionId);
      const sectionName = section?.name || '기타';
      const mapKey = `${q.sectionId}_${q.category}`;
      
      if (!categoriesMap[mapKey]) {
        categoriesMap[mapKey] = { category: q.category, total: 0, correct: 0, sectionName };
      }
      categoriesMap[mapKey].total += 1;
      if (correct) categoriesMap[mapKey].correct += 1;
    });

    const finalScoreBySection: Record<string, number> = {};
    const finalMaxScoreBySection: Record<string, number> = {};
    
    sections.forEach(s => {
      const maxP = rawMaxScoreBySection[s.id] || 1;
      const earnedP = rawScoreBySection[s.id] || 0;
      
      const isStandardized = ['EPT', 'TOEFL', 'TOEFL JR.', '독해 Lv.'].some(type => s.name.includes(type));
      
      let scaledScore = 0;
      if (isStandardized) {
        scaledScore = (earnedP / maxP) * 100;
      } else {
        let baseScore = 0;
        if (s.name.includes('독해')) {
          baseScore = 37;
        } else if (s.name.includes('문법')) {
          baseScore = 40;
        }
        
        const earnedRatio = earnedP / maxP;
        scaledScore = baseScore + (earnedRatio * (100 - baseScore));
      }
      
      finalScoreBySection[s.id] = Math.ceil(scaledScore);
      finalMaxScoreBySection[s.id] = 100;
    });

    const categoryResults = Object.values(categoriesMap).map(entry => ({
      category: entry.category,
      sectionName: entry.sectionName,
      totalQuestions: entry.total,
      correctCount: entry.correct,
      percentage: (entry.correct / entry.total) * 100
    }));

    return {
      studentName: studentInput.name,
      totalScore: 0,
      scoreBySection: finalScoreBySection,
      maxScoreBySection: finalMaxScoreBySection,
      categoryResults,
      isCorrect
    } as EvaluationResult;
  }, [questions, studentInput, sections]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getComment = (sectionName: string, score: number) => {
    // Find the test type that matches the section name
    // Sort by length descending to match more specific types first (e.g., "TOEFL JR." before "TOEFL")
    const sortedTypes = [...ALL_TEST_TYPES].sort((a, b) => b.length - a.length);
    const testType = sortedTypes.find(type => sectionName.includes(type)) || '일반';
    
    if (!TEST_COMMENTS[testType]) return TEST_COMMENTS['일반'][0];

    const criteria = TEST_COMMENTS[testType];
    const match = criteria.find(c => {
      const minMatch = score >= c.minScore;
      const maxMatch = c.maxScore === undefined || score <= c.maxScore;
      return minMatch && maxMatch;
    });

    return match || criteria[0] || TEST_COMMENTS['일반'][0];
  };

  const renderComments = () => {
    if (!result) return null;

    const comments: { sectionName: string; level: string; achievement: string }[] = [];
    const grammarSections: { sectionName: string; score: number; id: string }[] = [];
    const readingTypes = ['EPT', 'TOEFL JR.', 'TOEFL', '독해 Lv.1', '독해 Lv.2', '독해 Lv.3', '독해 Lv.4', '독해'];

    sections.forEach(s => {
      const isGrammar = GRAMMAR_TEST_TYPES.some(type => s.name.includes(type));
      const isReading = readingTypes.some(type => s.name.includes(type));
      
      const rawScore = questions
        .filter(q => q.sectionId === s.id && result.isCorrect[q.id])
        .reduce((sum, q) => sum + q.points, 0);

      if (isGrammar) {
        grammarSections.push({ sectionName: s.name, score: rawScore, id: s.id });
      } else {
        const scaledScore = result.scoreBySection[s.id];
        const comment = getComment(s.name, scaledScore);
        if (comment) {
          const displayName = isReading ? "독해 평가" : s.name;
          comments.push({ sectionName: displayName, level: comment.level, achievement: comment.achievement });
        }
      }
    });

    // Handle grammar sections: pick the one with the highest score
    if (grammarSections.length > 0) {
      const bestGrammar = grammarSections.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      const scaledScore = result.scoreBySection[bestGrammar.id];
      const comment = getComment(bestGrammar.sectionName, scaledScore);
      if (comment) {
        comments.push({ sectionName: "문법 평가", level: comment.level, achievement: comment.achievement });
      }
    }

    if (comments.length === 0) {
      // Final fallback if somehow still empty
      return (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm page-break-avoid space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <div className="w-2 h-6 rounded-full bg-indigo-500"></div>
            Evaluation & Comments
          </h3>
          <p className="text-slate-400 text-sm italic">평가 데이터가 부족하여 코멘트를 생성할 수 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm page-break-avoid space-y-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <div className="w-2 h-6 rounded-full bg-indigo-500"></div>
          Evaluation & Comments
        </h3>
        <div className="space-y-6">
          {comments.map((c, idx) => (
            <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{c.sectionName}</span>
                <span className="text-indigo-600 font-bold text-sm">{c.level}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {c.achievement}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const copyShareLink = () => {
    try {
      const uniqueCats = Array.from(new Set(questions.map(q => q.category)));
      const catDictStr = uniqueCats.join(',');
      const sectionsStr = sections.map(s => {
        const colorIdx = COLOR_MAP.indexOf(s.color);
        return `${s.name},${s.questionCount},${colorIdx === -1 ? 0 : colorIdx}`;
      }).join(';');
      const questionsStr = questions.map(q => {
        const catIdx = uniqueCats.indexOf(q.category);
        const pts = q.points === 1 ? '' : q.points.toString();
        return `${catIdx},${q.correctAnswer},${pts}`;
      }).join(';');
      const answersStr = questions.map(q => studentInput.answers[q.id] || "").join(';');
      const pack = [studentInput.name, sectionsStr, catDictStr, questionsStr, answersStr].join('~');
      const compressed = LZString.compressToEncodedURIComponent(pack);
      const url = `${window.location.origin}${window.location.pathname}#s=${compressed}`;
      navigator.clipboard.writeText(url).then(() => alert("성적표 공유 링크가 복사되었습니다."));
    } catch (err) {
      alert("링크 생성 실패");
    }
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    
    const originalStyle = reportRef.current.getAttribute('style');
    reportRef.current.style.width = '1200px';
    reportRef.current.style.maxWidth = 'none';
    reportRef.current.style.padding = '40px';
    reportRef.current.style.backgroundColor = '#f8fafc';

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#f8fafc',
        windowWidth: 1200,
        height: reportRef.current.scrollHeight,
        scrollY: -window.scrollY,
        logging: false
      });

      if (originalStyle) {
        reportRef.current.setAttribute('style', originalStyle);
      } else {
        reportRef.current.removeAttribute('style');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`${studentInput.name}_성적표.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!result) return <div className="p-20 text-center font-bold text-slate-400">데이터를 불러오는 중입니다...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-wrap justify-end gap-3 no-print px-4 md:px-0">
        {!isShared && (
          <button onClick={copyShareLink} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95">
            <i className="fas fa-share-nodes text-indigo-500"></i> 공유 링크 복사
          </button>
        )}
        <button onClick={downloadPdf} disabled={isGeneratingPdf} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
          {isGeneratingPdf ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-file-pdf"></i> PDF 저장하기</>}
        </button>
      </div>

      <div ref={reportRef} id="report-container" className="space-y-6 p-4 md:p-0 transition-all duration-300 origin-top">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block bg-indigo-500/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-500/30">Official Student Report</span>
                <h2 className="text-4xl font-black">{result.studentName} 학생</h2>
              </div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                {sections.map(s => (
                  <div key={s.id} className="bg-white/10 px-8 py-6 rounded-[1.5rem] border border-white/10 min-w-[180px] backdrop-blur-sm transition-all hover:bg-white/15 flex items-center justify-center">
                    <span className="text-xl font-black tracking-tight text-white">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {renderComments()}

        <div className="grid grid-cols-1 gap-8">
          {sections.map((section) => {
            const sectionData = result.categoryResults
              .filter(r => r.sectionName === section.name && r.percentage > 0)
              .sort((a, b) => b.percentage - a.percentage);
            return (
              <div key={section.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm page-break-avoid">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <div className={`w-2 h-6 rounded-full bg-gradient-to-b ${section.color}`}></div>
                    {section.name} Analysis
                  </h3>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={sectionData} 
                      layout={isMobile ? "horizontal" : "vertical"} 
                      margin={{ left: isMobile ? 0 : 40, right: 40, top: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={!isMobile} vertical={isMobile} />
                      <XAxis 
                        type={isMobile ? "category" : "number"} 
                        dataKey={isMobile ? "category" : undefined} 
                        domain={isMobile ? undefined : [0, 100]} 
                        hide={!isMobile} 
                      />
                      <YAxis 
                        type={isMobile ? "number" : "category"} 
                        dataKey={isMobile ? undefined : "category"} 
                        domain={isMobile ? [0, 100] : undefined} 
                        hide={isMobile} 
                        width={110} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                      />
                      <Bar dataKey="percentage" radius={isMobile ? [6, 6, 0, 0] : [0, 6, 6, 0]} barSize={28}>
                        {sectionData.map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={entry.percentage >= 80 ? '#10b981' : entry.percentage >= 50 ? '#6366f1' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isShared && (
        <div className="flex justify-center pt-8 no-print px-4">
          <button onClick={onReset} className="w-full md:w-auto bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">
            처음으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportView;
