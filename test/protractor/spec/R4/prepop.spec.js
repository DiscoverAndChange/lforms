var fhirVersion = 'R4'; // for questionnaire resources

var po = require('../addFormToPageTest.po');
var tp = require('../lforms_testpage.po.js');
var mockFHIRContext = require('./fhir_context');

/**
 *  Sets up a mock server FHIR context.  This will also set the page to do
 *  prepopulation.  (If that is not desired, call setFHIRPropulation(false).
 * @param fhirVersion the FHIR version number (as a string) for the mock server.
 * @param weightQuantity the quantity to return from a search for a weight.
 */
function setServerFHIRContext(fhirVersion, weightQuantity) {
  browser.executeScript(function(fhirVersion, mockFHIRContext, weightQuantity) {
    try {
      var fhirContext = new Function("return "+mockFHIRContext)();
      LForms.Util.setFHIRContext(fhirContext(fhirVersion, weightQuantity));
    }
    catch(e) {
      console.log("caught error in executeScript");
      console.log(e);
    }
  }, fhirVersion, mockFHIRContext, weightQuantity);
  setFHIRPrepopulation(true);
}

/**
 *  Enables or disables prepopulation (from the mock FHIR context) when a Questionnaire is
 *  loaded.
 * @param enable whether the prepopulation should be enabled.
 */
function setFHIRPrepopulation(enable) {
  browser.executeScript('window.prepopulateFHIR = '+enable);
}


describe('Form pre-population', function() {
  for (let serverFHIRNum of ['3.0', '4.0']) {
    it('should be able to use %questionnaire in expressions with server FHIR version '+serverFHIRNum, function() {
      tp.openBaseTestPage();
      setServerFHIRContext(serverFHIRNum);
      tp.loadFromTestData('phq9.json', 'R4');
      // This test form does prepoluation of the first answer.
      // This is also a test of prepoluation of list questions.
      var firstQ = element(by.id('/44250-9/1'));
      browser.wait(function() {return firstQ.getAttribute('value')}, 2000)
      expect(firstQ.getAttribute('value')).toBe('0. Not at all - 0');
      var sum = element(by.id('/44261-6/1'));
      browser.wait(function() {return sum.getAttribute('value')}, 2000)
      expect(sum.getAttribute('value')).toBe('0');
    });
  }

  describe('with bower packages', function() {
    beforeAll(function () {
      tp.openBaseTestPage();
    });

    it('should be possible to pull in data from a FHIR context', function() {
      setServerFHIRContext('3.0');
      tp.loadFromTestData('ussg-fhp.json', 'R4');
      expect(tp.USSGFHTVertical.name.getAttribute('value')).toBe("John Smith");
      expect(tp.USSGFHTVertical.dob.getAttribute('value')).toBe("12/10/1990");
      // expect(tp.USSGFHTVertical.gender.getAttribute('value')).toBe("Male"); // TBD
      // initialExpression fields should not be read-only.
      expect(tp.USSGFHTVertical.name.getAttribute('disabled')).toBe(null);
    });

    it('should be possible to get a Questionnaire back with launchContext', function() {
      setServerFHIRContext('3.0');
      var launchContextExt = browser.executeScript(function(fhirVersion) {
        var q2Data = LForms.Util.getFormFHIRData('Questionnaire', fhirVersion);
        return LForms.Util.findObjectInArray(q2Data.extension, 'url',
          "http://hl7.org/fhir/StructureDefinition/questionnaire-launchContext",
          0);
      }, fhirVersion);
      expect(launchContextExt).not.toBeNull();
    });


    for (let serverFHIRNum of ['3.0', '4.0']) {
      describe('by observationLinkPeriod with server FHIR version '+serverFHIRNum,
               function() {
        it('should load values from observationLinkPeriod', function() {
          tp.openBaseTestPage();
          setServerFHIRContext(serverFHIRNum);
          tp.loadFromTestData('weightHeightQuestionnaire.json', 'R4');
          var weightField = element(by.id('/29463-7/1'));
          browser.wait(function() {return weightField.getAttribute('value').then(function(val) {
            return val == '95'
          })}, 1000);
          expect(weightField.getAttribute('value')).toBe('95');
          var unitField = element(by.id('unit_/29463-7/1'));
          expect(unitField.getAttribute('value')).toBe('kg');
        });

        it('should not load values from observationLinkPeriod if prepopulation is disabled', function() {
          setServerFHIRContext(serverFHIRNum);
          setFHIRPrepopulation(false);
          tp.loadFromTestData('weightHeightQuestionnaire.json', 'R4');
          browser.sleep(20); // give asynchronous prepopulation a chance to happen
          var weightField = element(by.id('/29463-7/1'));
          expect(weightField.getAttribute('value')).toEqual('');
        });

        it('should convert values from observationLinkPeriod', function() {
          setServerFHIRContext(serverFHIRNum, {
            "value": 140,
            "unit": "[lb_av]",
            "system": "http://unitsofmeasure.org",
            "code": "[lb_av]"
          });

          tp.loadFromTestData('weightHeightQuestionnaire.json', 'R4');
          var weightField = element(by.id('/29463-7/1'));
          expect(weightField.getAttribute('value')).toBe('63.5');
          var unitField = element(by.id('unit_/29463-7/1'));
          expect(unitField.getAttribute('value')).toBe('kg');
        });
      });

      describe('addFormToPage', function() {
        it('should not load values from observationLinkPeriod if prepopulation '+
           'is disabled, with server FHIR version '+serverFHIRNum, function() {
          po.openPage();
          setServerFHIRContext(serverFHIRNum);
          setFHIRPrepopulation(false);
          tp.loadFromTestData('weightHeightQuestionnaire.json', 'R4');
          browser.sleep(20); // give asynchronous prepopulation a chance to happen
          var weightField = element(by.id('/29463-7/1'));
          expect(weightField.getAttribute('value')).toEqual('');
        });

        it('should load values from observationLinkPeriod if prepopulation '+
           'is enabled, with server FHIR version '+serverFHIRNum, function() {
          po.openPage();
          setServerFHIRContext(serverFHIRNum);
          setFHIRPrepopulation(true);
          tp.loadFromTestData('weightHeightQuestionnaire.json', 'R4');
          // Check the promise from the addFormToPage (called by
          // loadFromTestData).
          browser.wait(function() {return browser.executeScript('return ' +
            'window.addFormToPageDone')}, 2000);
          browser.sleep(20); // give asynchronous prepopulation a chance to happen
          var weightField = element(by.id('/29463-7/1'));
          expect(weightField.getAttribute('value')).toEqual('95');
        });
      });
    }
  });

  describe('with npm packages', function() {
    it('should load values from observationLinkPeriod', function() {
      tp.openBuildTestFHIRPath();
      setServerFHIRContext('4.0');
      tp.loadFromTestData('weightHeightQuestionnaire.json', 'R4');
      var weightField = element(by.id('/29463-7/1'));
      expect(weightField.getAttribute('value')).toBe('95');
      var unitField = element(by.id('unit_/29463-7/1'));
      expect(unitField.getAttribute('value')).toBe('kg');
    });

  });
});

