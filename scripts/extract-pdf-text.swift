// Dumps a PDF's text layer — what an applicant tracking system reads, as
// opposed to what the page looks like. Run it after build-resume.mjs to check
// that words stay whole and each job title still sits next to its dates:
//
//   swift scripts/extract-pdf-text.swift static/miguel-solorio-resume.pdf

import Foundation
import PDFKit

guard CommandLine.arguments.count > 1 else {
    print("usage: swift scripts/extract-pdf-text.swift <file.pdf>")
    exit(2)
}

let path = CommandLine.arguments[1]
guard let document = PDFDocument(url: URL(fileURLWithPath: path)) else {
    print("Could not open \(path)")
    exit(1)
}

print("pages: \(document.pageCount)")
if let attributes = document.documentAttributes {
    print("Title: \(attributes[PDFDocumentAttribute.titleAttribute] ?? "<none>")")
    print("Author: \(attributes[PDFDocumentAttribute.authorAttribute] ?? "<none>")")
}
print("---- extracted text ----")
print(document.string ?? "<no text layer>")
