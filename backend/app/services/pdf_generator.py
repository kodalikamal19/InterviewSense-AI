import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_report_pdf(report_data: dict) -> bytes:
    """
    Generates a beautifully styled evaluation report PDF using ReportLab Platypus.
    Returns the compiled file bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Design custom colors matching our visual brand style tokens
    primary_color = colors.HexColor("#4F46E5") # Accent Indigo
    slate_dark = colors.HexColor("#1E293B") # Slate Dark Text
    slate_light = colors.HexColor("#64748B") # Slate Light Text
    bg_light = colors.HexColor("#F8FAFC") # Soft Background
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=primary_color,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=slate_dark,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        textColor=slate_dark,
        leading=13,
        spaceAfter=5
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=slate_light,
        leading=13
    )
    
    story = []
    
    # 1. Header Information Block
    story.append(Paragraph("InterviewSense AI Candidate Evaluation", title_style))
    
    meta_text = (
        f"<b>Candidate:</b> {report_data.get('candidate_name')}<br/>"
        f"<b>Email:</b> {report_data.get('candidate_email')}<br/>"
        f"<b>Target Role:</b> {report_data.get('role_title')}<br/>"
        f"<b>Overall Score:</b> {report_data.get('score')} / 10<br/>"
        f"<b>Recommendation:</b> {report_data.get('recommendation')}"
    )
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 12))
    
    # Section Divider Line
    line_data = [[""]]
    line_table = Table(line_data, colWidths=[532], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 12))
    
    # 2. Summary
    story.append(Paragraph("AI Evaluation Summary", h1_style))
    story.append(Paragraph(report_data.get("summary", ""), body_style))
    story.append(Spacer(1, 10))
    
    # 3. Strengths & Weaknesses side-by-side
    story.append(Paragraph("Strengths & Areas of Improvement", h1_style))
    
    strengths_paragraphs = []
    for s in report_data.get("strengths", []):
        strengths_paragraphs.append(Paragraph(f"•  {s}", bullet_style))
        
    weaknesses_paragraphs = []
    for w in report_data.get("weaknesses", []):
        weaknesses_paragraphs.append(Paragraph(f"•  {w}", bullet_style))
        
    col_width = 532 / 2
    table_data = [
        [
            Paragraph("<b>Key Strengths</b>", h2_style),
            Paragraph("<b>Improvement Areas</b>", h2_style)
        ],
        [
            strengths_paragraphs,
            weaknesses_paragraphs
        ]
    ]
    sw_table = Table(table_data, colWidths=[col_width, col_width])
    sw_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sw_table)
    story.append(Spacer(1, 12))
    
    # Section Divider Line
    story.append(line_table)
    story.append(Spacer(1, 12))

    # 4. Resume Consistency & Communication
    story.append(Paragraph("Resume Consistency Check", h1_style))
    story.append(Paragraph(f"<b>Verification Status:</b> {report_data.get('resume_consistency_status', 'N/A')}", body_style))
    if report_data.get('resume_consistency_details'):
        story.append(Paragraph(report_data.get('resume_consistency_details'), body_style))
    story.append(Spacer(1, 10))

    comm = report_data.get('communication_metrics', {})
    story.append(Paragraph("Communication Analysis", h1_style))
    story.append(Paragraph(f"•  <b>Estimated Speaking Speed:</b> {comm.get('wpm', 0)} words per minute (WPM)", bullet_style))
    story.append(Paragraph(f"•  <b>Filler Words Count:</b> {comm.get('filler_words_count', 0)} instances identified", bullet_style))
    story.append(Paragraph(f"•  <b>Language Grammar Quality:</b> {comm.get('grammar_score', 'N/A')}", bullet_style))
    story.append(Spacer(1, 12))

    # Section Divider Line
    story.append(line_table)
    story.append(Spacer(1, 12))
    
    # 4. Question Breakdown
    story.append(Paragraph("Question-by-Question Evaluation", h1_style))
    
    for idx, qa in enumerate(report_data.get("questions_answers", [])):
        qa_block = []
        qa_block.append(Paragraph(f"<b>Q{idx+1}. [{qa.get('round_classification', 'Technical')}] &mdash; Score: {qa.get('score')}/10</b>", h2_style))
        qa_block.append(Paragraph(f"<b>Question Asked:</b> {qa.get('question_text')}", body_style))
        if qa.get("answer_text"):
            qa_block.append(Paragraph(f"<b>Candidate Answer:</b> <i>\"{qa.get('answer_text')}\"</i>", body_style))
            
        # Format the feedback block with a soft background border callout table
        fb_content = [
            [Paragraph(f"<b>AI Correctness Feedback:</b> {qa.get('feedback')}", body_style)]
        ]
        fb_table = Table(fb_content, colWidths=[510])
        fb_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        
        qa_block.append(fb_table)
        qa_block.append(Spacer(1, 10))
        
        story.append(KeepTogether(qa_block))
        
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
