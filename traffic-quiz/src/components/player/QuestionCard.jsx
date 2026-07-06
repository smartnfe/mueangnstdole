export default function QuestionCard({ question, selectedAnswer, onSelectAnswer, questionNumber, totalQuestions }) {
  const choiceLabels = ['ก', 'ข', 'ค', 'ง'];
  const choiceColors = [
    'hover:border-blue-300 hover:bg-blue-50/50',
    'hover:border-emerald-300 hover:bg-emerald-50/50',
    'hover:border-orange-300 hover:bg-orange-50/50',
    'hover:border-purple-300 hover:bg-purple-50/50',
  ];
  const selectedColors = [
    'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
    'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200',
    'border-orange-500 bg-orange-50 ring-2 ring-orange-200',
    'border-purple-500 bg-purple-50 ring-2 ring-purple-200',
  ];
  const labelColors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-purple-500',
  ];
  const selectedLabelColors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-orange-600',
    'bg-purple-600',
  ];

  return (
    <div className="animate-slide-in-right">
      {/* Question */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
            {questionNumber}
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed pt-1.5">
            {question.question}
          </h3>
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {question.choices.map((choice, index) => {
          const isSelected = selectedAnswer === index;
          // Extract the text after the label prefix (e.g., "ก. ")
          const choiceText = choice.replace(/^[ก-ง]\.\s*/, '');
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(index)}
              className={`choice-option w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected 
                  ? selectedColors[index] 
                  : `border-gray-100 bg-white ${choiceColors[index]}`
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-colors duration-200
                  ${isSelected ? selectedLabelColors[index] : `${labelColors[index]} opacity-80`}
                `}>
                  {choiceLabels[index]}
                </span>
                <span className={`text-sm sm:text-base leading-relaxed ${isSelected ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                  {choiceText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
