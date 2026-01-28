
import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { EvaluationResult, Question, StudentInput, SectionConfig } from '../types';
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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  // 문법 영역
  "명사/대명사": "문장의 주인이 되는 대상을 지칭하고 이를 대신하는 표현의 쓰임을 이해했는지 물어봅니다.",
  "동사": "주어의 동작이나 상태를 나타내어 문장을 완성하는 기본 원리를 이해를 확인합니다.",
  "형용사/부사": "대상의 상태나 동작을 구체적으로 묘사하여 의미를 풍부하게 하는 법을 이해했는지 물어봅니다.",
  "관사": "명사 앞에서 특정 여부를 결정짓는 a, an, the의 정확한 사용법을 이해를 확인합니다.",
  "의문사": "육하원칙에 따라 정보를 묻고 답하는 의문문의 구조를 이해했는지 물어봅니다.",
  "조동사": "동사에 능력, 허가, 의무 등의 세밀한 의미를 더하는 조동사의 역할을 이해를 확인합니다.",
  "시제": "사건이 일어난 시점을 과거, 현재, 미래로 정확히 표현하는 법을 이해했는지 물어봅니다.",
  "문장 형식": "동사의 성격에 따라 결정되는 5가지 문장 구성 원리를 이해를 확인합니다.",
  "문장 형태": "긍정, 부정, 의문 등 상황에 따라 문장의 형태를 바꾸는 법을 이해했는지 물어봅니다.",
  "접속사": "접속사를 활용해 원인, 양보, 조건을 표현하며 글의 전개 흐름을 매끄럽게 구성하는 능력을 이해했는지 물어봅니다.",
  "비교급": "대상 간의 정도 차이를 비교하거나 최상의 상태를 표현하는 방식을 이해했는지 물어봅니다.",
  "동명사/to 부정사": "동명사와 to 부정사의 쓰임을 이해하고, 특정 동사에서 형태에 따라 의미가 달라지는 것을 파악하고 있는지 물어봅니다.",
  "관계사": "선행사의 성격에 따라 알맞은 관계사를 선택하고, 복잡한 문장을 세련되게 결합하는 능력을 갖추었는지 확인합니다.",
  "분사/분사구문": "동사를 형용사처럼 활용하여 명사를 수식하는 현재분사와 과거분사의 의미 차이를 명확히 이해했는지 물어봅니다. 또한, 접속사가 포함된 긴 문장을 분사구문으로 축약하여 글의 효율성을 높이는 고급 문장 구성 원리를 이해를 확인합니다.",
  "가정법": "'조건절', '가정법 과거', '가정법 과거완료'의 차이를 명확히 구분하여 문장을 완성할 수 있는지 이해를 확인합니다. 또한 화자의 심리적 거리감을 표현하는 특수한 시제 규칙을 영작에 올바르게 적용하는지를 이해했는지 물어봅니다.",
  "특수구문": "강조, 도치, 생략 등을 통해 문장의 특정 의미를 부각하는 기법을 이해했는지 물어봅니다.",
  "전치사": "문장 내 명사(구) 간의 시간, 장소, 방향 등의 논리적 관계를 설정하는 능력을 평가합니다. 동사나 형용사와 결합하여 쓰이는 관용적 표현을 알고 있는지 확인합니다.",
  
  // 독해 영역
  "주제/제목 찾기": "글 전체를 관통하는 핵심 소재와 저자가 전달하고자 하는 결정적인 견해를 파악했는지 확인합니다.",
  "목적 파악": "글을 쓴 구체적인 동기(요청, 감사, 공지 등)가 무엇인지 파악했는지 확인합니다.",
  "심경 및 분위기 파악": "글에 나타난 전반적인 상황의 공기나 인물의 정서적 상태를 파악했는지 확인합니다.",
  "함축 의미 추론": "밑줄 친 비유적·상징적 표현이 실제 문맥 안에서 어떤 의미로 쓰였는지 파악했는지 확인합니다.",
  "빈칸 추론": "글의 핵심 논리를 바탕으로 빈칸에 들어갈 가장 적절한 논리적 근거를 파악했는지 확인합니다.",
  "무관한 문장 찾기": "전체적인 주제의 흐름을 방해하거나 논점이 이탈된 문장을 파악했는지 확인합니다.",
  "순서 배열": "지시어, 연결어, 대명사 등의 단서를 활용해 글의 선후 관계를 논리적으로 파악했는지 확인합니다.",
  "문장 삽입": "주어진 문장이 들어갈 적절한 위치를 찾아 문장 간의 논리적 연결 고리를 파악했는지 확인합니다.",
  "요약문 완성": "지문의 전체 내용을 한 문장으로 압축할 때 필요한 핵심 키워드를 파악했는지 확인합니다.",
  "내용 일치": "지문에 제시된 구체적인 정보와 선택지의 진술이 일치하는지 여부를 정확히 파악했는지 확인합니다.",
  "어법/어휘": "문장의 구조적 적합성과 문맥에 맞는 정확한 단어의 쓰임을 파악했는지 확인합니다.",
  "장문 독해": "긴 지문 속에서 전체적인 흐름과 세부적인 정보를 동시에 파악했는지 확인합니다."
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const category = data.category.trim();
    const description = CATEGORY_DESCRIPTIONS[category];
    
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 max-w-[280px]">
        <div className="flex justify-between items-center gap-4 mb-2">
          <p className="font-bold text-indigo-300 text-sm">{data.category}</p>
          <p className="text-xs font-black bg-indigo-500 px-2 py-0.5 rounded-lg shrink-0">{Math.round(data.percentage)}%</p>
        </div>
        {description && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
              {description}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface Props {
  sections: SectionConfig[];
  questions: Question[];
  studentInput: StudentInput;
  onReset: () => void;
  isShared?: boolean;
}

const ReportView: React.FC<Props> = ({ sections, questions, studentInput, onReset, isShared }) => {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    calculateResults();
    return () => window.removeEventListener('resize', handleResize);
  }, [questions, studentInput, sections]);

  const calculateResults = async () => {
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
      
      let baseScore = 0;
      if (s.name.includes('독해')) {
        baseScore = 37;
      } else if (s.name.includes('문법')) {
        baseScore = 40;
      }
      
      // 공식: 기본 점수 + (취득 점수 합계 / 총 배점 합계) * (100 - 기본 점수)
      const earnedRatio = earnedP / maxP;
      const scaledScore = baseScore + (earnedRatio * (100 - baseScore));
      
      finalScoreBySection[s.id] = Math.round(scaledScore * 10) / 10;
      finalMaxScoreBySection[s.id] = 100;
    });

    const categoryResults = Object.values(categoriesMap).map(entry => ({
      category: entry.category,
      sectionName: entry.sectionName,
      totalQuestions: entry.total,
      correctCount: entry.correct,
      percentage: (entry.correct / entry.total) * 100
    }));

    const finalResult: EvaluationResult = {
      studentName: studentInput.name,
      totalScore: 0, // 평균 점수는 더 이상 사용하지 않음
      scoreBySection: finalScoreBySection,
      maxScoreBySection: finalMaxScoreBySection,
      categoryResults,
      isCorrect
    };

    setResult(finalResult);
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
                  <div key={s.id} className="bg-white/10 px-6 py-4 rounded-[1.5rem] border border-white/10 min-w-[160px] backdrop-blur-sm transition-all hover:bg-white/15 text-center">
                    <span className="text-[11px] uppercase font-black text-indigo-300 block mb-1 tracking-widest">{s.name} SCORE</span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black tracking-tighter">{result.scoreBySection[s.id]}</span>
                      <span className="text-sm font-bold opacity-40">/ {result.maxScoreBySection[s.id]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {sections.map((section) => {
            const sectionData = result.categoryResults.filter(r => r.sectionName === section.name);
            return (
              <div key={section.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm page-break-avoid">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <div className={`w-2 h-6 rounded-full bg-gradient-to-b ${section.color}`}></div>
                    {section.name} Analysis
                  </h3>
                  <div className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    {result.scoreBySection[section.id]} / {result.maxScoreBySection[section.id]}
                  </div>
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
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                      <Bar dataKey="percentage" radius={isMobile ? [6, 6, 0, 0] : [0, 6, 6, 0]} barSize={28}>
                        {sectionData.map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={entry.percentage >= 80 ? '#10b981' : entry.percentage >= 50 ? '#6366f1' : '#f43f5e'} />
                        ))}
                        <LabelList 
                          dataKey="percentage" 
                          position={isMobile ? "top" : "right"} 
                          formatter={(v: number) => `${Math.round(v)}%`} 
                          style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }} 
                        />
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
