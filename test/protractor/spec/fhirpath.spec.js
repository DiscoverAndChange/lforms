var tp = require('./lforms_testpage.po.js');
var testUtil = require('./util.js');
var fhirSupport = require('../../../app/scripts/fhir/versions');
var fhirVersions = Object.keys(fhirSupport);

for (var i=0, len=fhirVersions.length; i<len; ++i) {
  (function (fhirVersion) {
    describe(fhirVersion, function() {
      describe('FHIRPath functionality', function() {
        describe('FHIRPath calculated-expression', function() {
          function testBMIFormula() {
            tp.loadFromTestData('weightHeightQuestionnaire.json', fhirVersion);
            let weightField = element(by.id('/29463-7/1'));
            weightField.click();
            testUtil.sendKeys(weightField, '70');
            let heightField = element(by.id('/8302-2/1'));
            testUtil.sendKeys(heightField, '60');
            heightField.click();
            weightField.click(); // so heightField gets a change event
            let bmiField = element(by.id('/39156-5/1'));
            expect(bmiField.getAttribute('value')).toBeCloseTo(30, 0);
          }

          // A test of the questionnaire-calculatedExpression extension
          it('work to compute a BMI value', function() {
            tp.openBaseTestPage();
            testBMIFormula();
          });

          it('work to compute a BMI value with the built files', function() {
            tp.openBuildTestFHIRPath();
            testBMIFormula();
          });
        });
      });
    });
  })(fhirVersions[i]);
}
