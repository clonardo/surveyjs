/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var DragDropHelper = (function () {
        function DragDropHelper(data, onModifiedCallback) {
            this.data = data;
            this.onModifiedCallback = onModifiedCallback;
        }
        Object.defineProperty(DragDropHelper.prototype, "survey", {
            get: function () { return this.data; },
            enumerable: true,
            configurable: true
        });
        DragDropHelper.prototype.startDragNewQuestion = function (event, questionType, questionName) {
            this.setData(event, DragDropHelper.dataStart + "questiontype:" + questionType + ",questionname:" + questionName);
        };
        DragDropHelper.prototype.startDragQuestion = function (event, questionName) {
            this.setData(event, DragDropHelper.dataStart + "questionname:" + questionName);
        };
        DragDropHelper.prototype.startDragCopiedQuestion = function (event, questionName, questionJson) {
            this.setData(event, DragDropHelper.dataStart + "questionname:" + questionName, questionJson);
        };
        DragDropHelper.prototype.isSurveyDragging = function (event) {
            if (!event)
                return false;
            var data = this.getData(event).text;
            return data && data.indexOf(DragDropHelper.dataStart) == 0;
        };
        DragDropHelper.prototype.doDragDropOver = function (event, question) {
            event = this.getEvent(event);
            if (!question || !this.isSurveyDragging(event) || this.isSamePlace(event, question))
                return;
            var index = this.getQuestionIndex(event, question);
            this.survey.currentPage["koDragging"](index);
        };
        DragDropHelper.prototype.doDrop = function (event, question) {
            if (question === void 0) { question = null; }
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (!this.isSurveyDragging(event))
                return;
            this.survey.currentPage["koDragging"](-1);
            var index = this.getQuestionIndex(event, question);
            var dataInfo = this.getDataInfo(event);
            this.clearData();
            if (!dataInfo)
                return;
            var targetQuestion = null;
            var json = dataInfo["json"];
            if (json) {
                targetQuestion = Survey.QuestionFactory.Instance.createQuestion(json["type"], name);
                new Survey.JsonObject().toObject(json, targetQuestion);
                targetQuestion.name = dataInfo["questionname"];
            }
            if (!targetQuestion) {
                targetQuestion = this.survey.getQuestionByName(dataInfo["questionname"]);
            }
            if (!targetQuestion && dataInfo["questiontype"]) {
                targetQuestion = Survey.QuestionFactory.Instance.createQuestion(dataInfo["questiontype"], dataInfo["questionname"]);
            }
            if (!targetQuestion)
                return;
            this.moveQuestionTo(targetQuestion, index);
        };
        DragDropHelper.prototype.getQuestionIndex = function (event, question) {
            var page = this.survey.currentPage;
            if (!question)
                return page.questions.length;
            var index = page.questions.indexOf(question);
            event = this.getEvent(event);
            var height = event.currentTarget["clientHeight"];
            var y = event.offsetY;
            if (event.hasOwnProperty('layerX')) {
                y = event.layerY - event.currentTarget["offsetTop"];
            }
            if (y > height / 2)
                index++;
            return index;
        };
        DragDropHelper.prototype.isSamePlace = function (event, question) {
            var prev = DragDropHelper.prevEvent;
            if (prev.question != question || Math.abs(event.clientX - prev.x) > 5 || Math.abs(event.clientY - prev.y) > 5) {
                prev.question = question;
                prev.x = event.clientX;
                prev.y = event.clientY;
                return false;
            }
            return true;
        };
        DragDropHelper.prototype.getEvent = function (event) {
            return event["originalEvent"] ? event["originalEvent"] : event;
        };
        DragDropHelper.prototype.moveQuestionTo = function (targetQuestion, index) {
            if (targetQuestion == null)
                return;
            var page = this.survey.getPageByQuestion(targetQuestion);
            if (page) {
                page.removeQuestion(targetQuestion);
            }
            this.survey.currentPage.addQuestion(targetQuestion, index);
            if (this.onModifiedCallback)
                this.onModifiedCallback();
        };
        DragDropHelper.prototype.getDataInfo = function (event) {
            var data = this.getData(event);
            if (!data)
                return null;
            var text = data.text.substr(DragDropHelper.dataStart.length);
            var array = text.split(',');
            var result = { json: null };
            for (var i = 0; i < array.length; i++) {
                var item = array[i].split(':');
                result[item[0]] = item[1];
            }
            result.json = data.json;
            return result;
        };
        DragDropHelper.prototype.getY = function (element) {
            var result = 0;
            while (element) {
                result += (element.offsetTop - element.scrollTop + element.clientTop);
                element = element.offsetParent;
            }
            return result;
        };
        DragDropHelper.prototype.setData = function (event, text, json) {
            if (json === void 0) { json = null; }
            if (event["originalEvent"]) {
                event = event["originalEvent"];
            }
            if (event.dataTransfer) {
                event.dataTransfer.setData("Text", text);
                event.dataTransfer.effectAllowed = "copy";
            }
            DragDropHelper.dragData = { text: text, json: json };
        };
        DragDropHelper.prototype.getData = function (event) {
            if (event["originalEvent"]) {
                event = event["originalEvent"];
            }
            if (event.dataTransfer) {
                var text = event.dataTransfer.getData("Text");
                if (text) {
                    DragDropHelper.dragData.text = text;
                }
            }
            return DragDropHelper.dragData;
        };
        DragDropHelper.prototype.clearData = function () {
            DragDropHelper.dragData = { text: "", json: null };
            var prev = DragDropHelper.prevEvent;
            prev.question = null;
            prev.x = -1;
            prev.y = -1;
        };
        DragDropHelper.dataStart = "surveyjs,";
        DragDropHelper.dragData = { text: "", json: null };
        DragDropHelper.prevEvent = { question: null, x: -1, y: -1 };
        return DragDropHelper;
    }());
    SurveyEditor.DragDropHelper = DragDropHelper;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyArray = (function () {
        function SurveyPropertyArray(onValueChanged) {
            this.onValueChanged = onValueChanged;
            this.object = null;
            this.title = ko.observable();
        }
        Object.defineProperty(SurveyPropertyArray.prototype, "value", {
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        return SurveyPropertyArray;
    }());
    SurveyEditor.SurveyPropertyArray = SurveyPropertyArray;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="objectPropertyArrays.ts" />
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyItemValues = (function (_super) {
        __extends(SurveyPropertyItemValues, _super);
        function SurveyPropertyItemValues(onValueChanged) {
            _super.call(this, onValueChanged);
            this.onValueChanged = onValueChanged;
            this.koItems = ko.observableArray();
            this.value_ = [];
            var self = this;
            self.onApplyClick = function () { self.Apply(); };
            self.onDeleteClick = function (item) { self.koItems.remove(item); };
            self.onClearClick = function (item) { self.koItems.removeAll(); };
            self.onAddClick = function () { self.AddItem(); };
        }
        Object.defineProperty(SurveyPropertyItemValues.prototype, "value", {
            get: function () { return this.value_; },
            set: function (value) {
                if (value == null || !Array.isArray(value))
                    value = [];
                this.value_ = value;
                var array = [];
                for (var i = 0; i < value.length; i++) {
                    var item = value[i];
                    var itemValue = item;
                    var itemText = null;
                    if (item.value) {
                        itemValue = item.value;
                        itemText = item.text;
                    }
                    array.push({ koValue: ko.observable(itemValue), koText: ko.observable(itemText), koHasError: ko.observable(false) });
                }
                this.koItems(array);
            },
            enumerable: true,
            configurable: true
        });
        SurveyPropertyItemValues.prototype.AddItem = function () {
            this.koItems.push({ koValue: ko.observable(), koText: ko.observable(), koHasError: ko.observable(false) });
        };
        SurveyPropertyItemValues.prototype.Apply = function () {
            if (this.hasError())
                return;
            this.value_ = [];
            for (var i = 0; i < this.koItems().length; i++) {
                var item = this.koItems()[i];
                if (item.koText()) {
                    this.value_.push({ value: item.koValue(), text: item.koText() });
                }
                else {
                    this.value_.push(item.koValue());
                }
            }
            if (this.onValueChanged) {
                this.onValueChanged(this.value_);
            }
        };
        SurveyPropertyItemValues.prototype.hasError = function () {
            var result = false;
            for (var i = 0; i < this.koItems().length; i++) {
                var item = this.koItems()[i];
                item.koHasError(!item.koValue());
                result = result || item.koHasError();
            }
            return result;
        };
        return SurveyPropertyItemValues;
    }(SurveyEditor.SurveyPropertyArray));
    SurveyEditor.SurveyPropertyItemValues = SurveyPropertyItemValues;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyTriggers = (function (_super) {
        __extends(SurveyPropertyTriggers, _super);
        function SurveyPropertyTriggers(onValueChanged) {
            _super.call(this, onValueChanged);
            this.onValueChanged = onValueChanged;
            this.availableTriggers = [];
            this.triggerClasses = [];
            var self = this;
            this.koItems = ko.observableArray();
            this.koSelected = ko.observable(null);
            this.koPages = ko.observableArray();
            this.koQuestions = ko.observableArray();
            this.triggerClasses = Survey.JsonObject.metaData.getChildrenClasses("surveytrigger", true);
            this.availableTriggers = this.getAvailableTriggers();
            this.value_ = [];
            this.onDeleteClick = function () { self.koItems.remove(self.koSelected()); };
            this.onAddClick = function (triggerType) { self.addItem(triggerType); };
            this.onApplyClick = function () { self.apply(); };
        }
        Object.defineProperty(SurveyPropertyTriggers.prototype, "value", {
            get: function () { return this.value_; },
            set: function (value) {
                if (value == null || !Array.isArray(value))
                    value = [];
                this.value_ = value;
                var array = [];
                if (this.object) {
                    this.koPages(this.getNames(this.object.pages));
                    this.koQuestions(this.getNames(this.object.getAllQuestions()));
                }
                var jsonObj = new Survey.JsonObject();
                for (var i = 0; i < value.length; i++) {
                    var trigger = Survey.JsonObject.metaData.createClass(value[i].getType());
                    jsonObj.toObject(value[i], trigger);
                    array.push(this.createPropertyTrigger(trigger));
                }
                this.koItems(array);
                this.koSelected(array.length > 0 ? array[0] : null);
            },
            enumerable: true,
            configurable: true
        });
        SurveyPropertyTriggers.prototype.apply = function () {
            this.value_ = [];
            var array = this.koItems();
            for (var i = 0; i < array.length; i++) {
                this.value_.push(array[i].createTrigger());
            }
            if (this.onValueChanged) {
                this.onValueChanged(this.value_);
            }
        };
        SurveyPropertyTriggers.prototype.getAvailableTriggers = function () {
            var result = [];
            for (var i = 0; i < this.triggerClasses.length; i++) {
                result.push(this.triggerClasses[i].name);
            }
            return result;
        };
        SurveyPropertyTriggers.prototype.getNames = function (items) {
            var names = [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item["name"]) {
                    names.push(item["name"]);
                }
            }
            return names;
        };
        SurveyPropertyTriggers.prototype.addItem = function (triggerType) {
            var trigger = Survey.JsonObject.metaData.createClass(triggerType);
            var triggerItem = this.createPropertyTrigger(trigger);
            this.koItems.push(triggerItem);
            this.koSelected(triggerItem);
        };
        SurveyPropertyTriggers.prototype.createPropertyTrigger = function (trigger) {
            var triggerItem = null;
            if (trigger.getType() == "visibletrigger") {
                triggerItem = new SurveyPropertyVisibleTrigger(trigger, this.koPages, this.koQuestions);
            }
            if (trigger.getType() == "setvaluetrigger") {
                triggerItem = new SurveyPropertySetValueTrigger(trigger, this.koQuestions);
            }
            if (!triggerItem) {
                triggerItem = new SurveyPropertyTrigger(trigger);
            }
            return triggerItem;
        };
        return SurveyPropertyTriggers;
    }(SurveyEditor.SurveyPropertyArray));
    SurveyEditor.SurveyPropertyTriggers = SurveyPropertyTriggers;
    var SurveyPropertyTrigger = (function () {
        function SurveyPropertyTrigger(trigger) {
            this.trigger = trigger;
            this.operators = ["empty", "notempty", "equal", "notequal", "contains", "noncontains", "greater", "less", "greaterorequal", "lessorequal"];
            this.availableOperators = [];
            this.createOperators();
            this.triggerType = trigger.getType();
            this.koType = ko.observable(this.triggerType);
            this.koName = ko.observable(trigger.name);
            this.koOperator = ko.observable(trigger.operator);
            this.koValue = ko.observable(trigger.value);
            var self = this;
            this.koRequireValue = ko.computed(function () { return self.koOperator() != "empty" && self.koOperator() != "notempty"; });
            this.koIsValid = ko.computed(function () { if (self.koName() && (!self.koRequireValue() || self.koValue()))
                return true; return false; });
            this.koText = ko.computed(function () { self.koName(); self.koOperator(); self.koValue(); return self.getText(); });
        }
        SurveyPropertyTrigger.prototype.createTrigger = function () {
            var trigger = Survey.JsonObject.metaData.createClass(this.triggerType);
            trigger.name = this.koName();
            trigger.operator = this.koOperator();
            trigger.value = this.koValue();
            return trigger;
        };
        SurveyPropertyTrigger.prototype.createOperators = function () {
            for (var i = 0; i < this.operators.length; i++) {
                var name = this.operators[i];
                this.availableOperators.push({ name: name, text: SurveyEditor.editorLocalization.getString("op." + name) });
            }
        };
        SurveyPropertyTrigger.prototype.getText = function () {
            if (!this.koIsValid())
                return SurveyEditor.editorLocalization.getString("pe.triggerNotSet");
            return SurveyEditor.editorLocalization.getString("pe.triggerRunIf") + " '" + this.koName() + "' " + this.getOperatorText() + this.getValueText();
        };
        SurveyPropertyTrigger.prototype.getOperatorText = function () {
            var op = this.koOperator();
            for (var i = 0; i < this.availableOperators.length; i++) {
                if (this.availableOperators[i].name == op)
                    return this.availableOperators[i].text;
            }
            return op;
        };
        SurveyPropertyTrigger.prototype.getValueText = function () {
            if (!this.koRequireValue())
                return "";
            return " " + this.koValue();
        };
        return SurveyPropertyTrigger;
    }());
    SurveyEditor.SurveyPropertyTrigger = SurveyPropertyTrigger;
    var SurveyPropertyVisibleTrigger = (function (_super) {
        __extends(SurveyPropertyVisibleTrigger, _super);
        function SurveyPropertyVisibleTrigger(trigger, koPages, koQuestions) {
            _super.call(this, trigger);
            this.trigger = trigger;
            this.pages = new SurveyPropertyTriggerObjects(SurveyEditor.editorLocalization.getString("pe.triggerMakePagesVisible"), koPages(), trigger.pages);
            this.questions = new SurveyPropertyTriggerObjects(SurveyEditor.editorLocalization.getString("pe.triggerMakeQuestionsVisible"), koQuestions(), trigger.questions);
        }
        SurveyPropertyVisibleTrigger.prototype.createTrigger = function () {
            var trigger = _super.prototype.createTrigger.call(this);
            trigger.pages = this.pages.koChoosen();
            trigger.questions = this.questions.koChoosen();
            return trigger;
        };
        return SurveyPropertyVisibleTrigger;
    }(SurveyPropertyTrigger));
    SurveyEditor.SurveyPropertyVisibleTrigger = SurveyPropertyVisibleTrigger;
    var SurveyPropertySetValueTrigger = (function (_super) {
        __extends(SurveyPropertySetValueTrigger, _super);
        function SurveyPropertySetValueTrigger(trigger, koQuestions) {
            _super.call(this, trigger);
            this.trigger = trigger;
            this.koQuestions = koQuestions;
            this.kosetToName = ko.observable(trigger.setToName);
            this.kosetValue = ko.observable(trigger.setValue);
            this.koisVariable = ko.observable(trigger.isVariable);
        }
        SurveyPropertySetValueTrigger.prototype.createTrigger = function () {
            var trigger = _super.prototype.createTrigger.call(this);
            trigger.setToName = this.kosetToName();
            trigger.setValue = this.kosetValue();
            trigger.isVariable = this.koisVariable();
            return trigger;
        };
        return SurveyPropertySetValueTrigger;
    }(SurveyPropertyTrigger));
    SurveyEditor.SurveyPropertySetValueTrigger = SurveyPropertySetValueTrigger;
    var SurveyPropertyTriggerObjects = (function () {
        function SurveyPropertyTriggerObjects(title, allObjects, choosenObjects) {
            this.title = title;
            this.koChoosen = ko.observableArray(choosenObjects);
            var array = [];
            for (var i = 0; i < allObjects.length; i++) {
                var item = allObjects[i];
                if (choosenObjects.indexOf(item) < 0) {
                    array.push(item);
                }
            }
            this.koObjects = ko.observableArray(array);
            this.koSelected = ko.observable();
            this.koChoosenSelected = ko.observable();
            var self = this;
            this.onDeleteClick = function () { self.deleteItem(); };
            this.onAddClick = function () { self.addItem(); };
        }
        SurveyPropertyTriggerObjects.prototype.deleteItem = function () {
            this.changeItems(this.koChoosenSelected(), this.koChoosen, this.koObjects);
        };
        SurveyPropertyTriggerObjects.prototype.addItem = function () {
            this.changeItems(this.koSelected(), this.koObjects, this.koChoosen);
        };
        SurveyPropertyTriggerObjects.prototype.changeItems = function (item, removedFrom, addTo) {
            removedFrom.remove(item);
            addTo.push(item);
            removedFrom.sort();
            addTo.sort();
        };
        return SurveyPropertyTriggerObjects;
    }());
    SurveyEditor.SurveyPropertyTriggerObjects = SurveyPropertyTriggerObjects;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyValidators = (function (_super) {
        __extends(SurveyPropertyValidators, _super);
        function SurveyPropertyValidators(onValueChanged) {
            _super.call(this, onValueChanged);
            this.onValueChanged = onValueChanged;
            this.availableValidators = [];
            this.validatorClasses = [];
            var self = this;
            this.selectedObjectEditor = new SurveyEditor.SurveyObjectEditor();
            this.selectedObjectEditor.onPropertyValueChanged.add(function (sender, options) {
                self.onPropertyValueChanged(options.property, options.object, options.newValue);
            });
            this.koItems = ko.observableArray();
            this.koSelected = ko.observable(null);
            this.koSelected.subscribe(function (newValue) { self.selectedObjectEditor.selectedObject = newValue != null ? newValue.validator : null; });
            this.validatorClasses = Survey.JsonObject.metaData.getChildrenClasses("surveyvalidator", true);
            this.availableValidators = this.getAvailableValidators();
            this.value_ = [];
            this.onDeleteClick = function () { self.koItems.remove(self.koSelected()); };
            this.onAddClick = function (validatorType) { self.addItem(validatorType); };
            this.onApplyClick = function () { self.apply(); };
        }
        Object.defineProperty(SurveyPropertyValidators.prototype, "value", {
            get: function () { return this.value_; },
            set: function (value) {
                if (value == null || !Array.isArray(value))
                    value = [];
                this.value_ = value;
                var array = [];
                var jsonObj = new Survey.JsonObject();
                for (var i = 0; i < value.length; i++) {
                    var validator = Survey.JsonObject.metaData.createClass(value[i].getType());
                    jsonObj.toObject(value[i], validator);
                    array.push(new SurveyPropertyValidatorItem(validator));
                }
                this.koItems(array);
                this.koSelected(array.length > 0 ? array[0] : null);
            },
            enumerable: true,
            configurable: true
        });
        SurveyPropertyValidators.prototype.apply = function () {
            this.value_ = [];
            var array = this.koItems();
            for (var i = 0; i < array.length; i++) {
                this.value_.push(array[i].validator);
            }
            if (this.onValueChanged) {
                this.onValueChanged(this.value_);
            }
        };
        SurveyPropertyValidators.prototype.addItem = function (validatorType) {
            var newValidator = new SurveyPropertyValidatorItem(Survey.JsonObject.metaData.createClass(validatorType));
            this.koItems.push(newValidator);
            this.koSelected(newValidator);
        };
        SurveyPropertyValidators.prototype.getAvailableValidators = function () {
            var result = [];
            for (var i = 0; i < this.validatorClasses.length; i++) {
                result.push(this.validatorClasses[i].name);
            }
            return result;
        };
        SurveyPropertyValidators.prototype.onPropertyValueChanged = function (property, obj, newValue) {
            if (this.koSelected() == null)
                return;
            this.koSelected().validator[property.name] = newValue;
        };
        return SurveyPropertyValidators;
    }(SurveyEditor.SurveyPropertyArray));
    SurveyEditor.SurveyPropertyValidators = SurveyPropertyValidators;
    var SurveyPropertyValidatorItem = (function () {
        function SurveyPropertyValidatorItem(validator) {
            this.validator = validator;
            this.text = validator.getType();
        }
        return SurveyPropertyValidatorItem;
    }());
    SurveyEditor.SurveyPropertyValidatorItem = SurveyPropertyValidatorItem;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    (function (ObjType) {
        ObjType[ObjType["Unknown"] = 0] = "Unknown";
        ObjType[ObjType["Survey"] = 1] = "Survey";
        ObjType[ObjType["Page"] = 2] = "Page";
        ObjType[ObjType["Question"] = 3] = "Question";
    })(SurveyEditor.ObjType || (SurveyEditor.ObjType = {}));
    var ObjType = SurveyEditor.ObjType;
    var SurveyHelper = (function () {
        function SurveyHelper() {
        }
        SurveyHelper.getNewPageName = function (objs) {
            return SurveyHelper.getNewName(objs, SurveyEditor.editorLocalization.getString("ed.newPageName"));
        };
        SurveyHelper.getNewQuestionName = function (objs) {
            return SurveyHelper.getNewName(objs, SurveyEditor.editorLocalization.getString("ed.newQuestionName"));
        };
        SurveyHelper.getNewName = function (objs, baseName) {
            var hash = {};
            for (var i = 0; i < objs.length; i++) {
                hash[objs[i].name] = true;
            }
            var num = 1;
            while (true) {
                if (!hash[baseName + num.toString()])
                    break;
                num++;
            }
            return baseName + num.toString();
        };
        SurveyHelper.getObjectType = function (obj) {
            if (!obj || !obj["getType"])
                return ObjType.Unknown;
            if (obj.getType() == "page")
                return ObjType.Page;
            if (obj.getType() == "survey")
                return ObjType.Survey;
            if (obj["fullTitle"])
                return ObjType.Question;
            return ObjType.Unknown;
        };
        SurveyHelper.getObjectName = function (obj) {
            if (obj["name"])
                return obj["name"];
            var objType = SurveyHelper.getObjectType(obj);
            if (objType != ObjType.Page)
                return "";
            var data = obj.data;
            var index = data.pages.indexOf(obj);
            return "[Page " + (index + 1) + "]";
        };
        return SurveyHelper;
    }());
    SurveyEditor.SurveyHelper = SurveyHelper;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="objectPropertyArrays.ts" />
/// <reference path="surveyHelper.ts" />
/// <reference path="objectPropertyValidators.ts" />
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyTextItems = (function (_super) {
        __extends(SurveyPropertyTextItems, _super);
        function SurveyPropertyTextItems(onValueChanged) {
            _super.call(this, onValueChanged);
            this.onValueChanged = onValueChanged;
            this.koItems = ko.observableArray();
            this.value_ = [];
            var self = this;
            self.onApplyClick = function () { self.Apply(); };
            self.onDeleteClick = function (item) { self.koItems.remove(item); };
            self.onAddClick = function () { self.AddItem(); };
        }
        Object.defineProperty(SurveyPropertyTextItems.prototype, "value", {
            get: function () { return this.value_; },
            set: function (value) {
                if (value == null || !Array.isArray(value))
                    value = [];
                this.value_ = value;
                var array = [];
                for (var i = 0; i < value.length; i++) {
                    var item = value[i];
                    var editItem = { koName: ko.observable(item.name), koTitle: ko.observable(item.title) };
                    this.createValidatorsEditor(editItem, item.validators);
                    array.push(editItem);
                }
                this.koItems(array);
            },
            enumerable: true,
            configurable: true
        });
        SurveyPropertyTextItems.prototype.AddItem = function () {
            var objs = [];
            var array = this.koItems();
            for (var i = 0; i < array.length; i++) {
                objs.push({ name: array[i].koName() });
            }
            var editItem = { koName: ko.observable(SurveyEditor.SurveyHelper.getNewName(objs, "text")), koTitle: ko.observable() };
            this.createValidatorsEditor(editItem, []);
            this.koItems.push(editItem);
        };
        SurveyPropertyTextItems.prototype.Apply = function () {
            this.value_ = [];
            for (var i = 0; i < this.koItems().length; i++) {
                var item = this.koItems()[i];
                var itemText = new Survey.MultipleTextItem(item.koName(), item.koTitle());
                itemText.validators = item.validators;
                this.value_.push(itemText);
            }
            if (this.onValueChanged) {
                this.onValueChanged(this.value_);
            }
        };
        SurveyPropertyTextItems.prototype.createValidatorsEditor = function (item, validators) {
            item.validators = validators.slice();
            var self = this;
            var onItemChanged = function (newValue) { item.validators = newValue; item.koText(self.getText(newValue.length)); };
            item.arrayEditor = new SurveyEditor.SurveyPropertyValidators(function (newValue) { onItemChanged(newValue); });
            item.arrayEditor.object = item;
            item.arrayEditor.title(SurveyEditor.editorLocalization.getString("pe.editProperty")["format"]("Validators"));
            item.arrayEditor.value = item.validators;
            item.koText = ko.observable(this.getText(validators.length));
        };
        SurveyPropertyTextItems.prototype.getText = function (length) {
            return SurveyEditor.editorLocalization.getString("pe.items")["format"](length);
        };
        return SurveyPropertyTextItems;
    }(SurveyEditor.SurveyPropertyArray));
    SurveyEditor.SurveyPropertyTextItems = SurveyPropertyTextItems;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="objectPropertyArrays.ts" />
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyMatrixDropdownColumns = (function (_super) {
        __extends(SurveyPropertyMatrixDropdownColumns, _super);
        function SurveyPropertyMatrixDropdownColumns(onValueChanged) {
            _super.call(this, onValueChanged);
            this.onValueChanged = onValueChanged;
            this.koItems = ko.observableArray();
            this.value_ = [];
            var self = this;
            self.onApplyClick = function () { self.Apply(); };
            self.onDeleteClick = function (item) { self.koItems.remove(item); };
            self.onClearClick = function (item) { self.koItems.removeAll(); };
            self.onAddClick = function () { self.AddItem(); };
        }
        Object.defineProperty(SurveyPropertyMatrixDropdownColumns.prototype, "value", {
            get: function () { return this.value_; },
            set: function (value) {
                if (value == null || !Array.isArray(value))
                    value = [];
                this.value_ = value;
                var array = [];
                for (var i = 0; i < value.length; i++) {
                    array.push(new SurveyPropertyMatrixDropdownColumnsItem(value[i]));
                }
                this.koItems(array);
            },
            enumerable: true,
            configurable: true
        });
        SurveyPropertyMatrixDropdownColumns.prototype.AddItem = function () {
            this.koItems.push(new SurveyPropertyMatrixDropdownColumnsItem(new Survey.MatrixDropdownColumn("")));
        };
        SurveyPropertyMatrixDropdownColumns.prototype.Apply = function () {
            if (this.hasError())
                return;
            this.value_ = [];
            for (var i = 0; i < this.koItems().length; i++) {
                var item = this.koItems()[i];
                item.apply();
                this.value_.push(item.column);
            }
            if (this.onValueChanged) {
                this.onValueChanged(this.value_);
            }
        };
        SurveyPropertyMatrixDropdownColumns.prototype.hasError = function () {
            var result = false;
            for (var i = 0; i < this.koItems().length; i++) {
                result = result || this.koItems()[i].hasError();
            }
            return result;
        };
        return SurveyPropertyMatrixDropdownColumns;
    }(SurveyEditor.SurveyPropertyArray));
    SurveyEditor.SurveyPropertyMatrixDropdownColumns = SurveyPropertyMatrixDropdownColumns;
    var SurveyPropertyMatrixDropdownColumnsItem = (function () {
        function SurveyPropertyMatrixDropdownColumnsItem(column) {
            this.column = column;
            this.cellTypeChoices = this.getPropertyChoices("cellType");
            this.colCountChoices = this.getPropertyChoices("colCount");
            this.koName = ko.observable(column.name);
            this.koCellType = ko.observable(column.cellType);
            this.koColCount = ko.observable(column.colCount);
            this.koIsRequired = ko.observable(column["isRequired"] ? true : false);
            this.koHasOther = ko.observable(column["koHasOther"] ? true : false);
            this.koTitle = ko.observable(column.name === column.title ? "" : column.title);
            this.koShowChoices = ko.observable(false);
            this.koChoices = ko.observableArray(column.choices);
            this.koHasError = ko.observable(false);
            this.choicesEditor = new SurveyEditor.SurveyPropertyItemValues(null);
            this.choicesEditor.object = this.column;
            this.choicesEditor.value = this.koChoices();
            var self = this;
            this.onShowChoicesClick = function () { self.koShowChoices(!self.koShowChoices()); };
            this.koHasChoices = ko.computed(function () { return self.koCellType() == "dropdown" || self.koCellType() == "checkbox" || self.koCellType() == "radiogroup"; });
            this.koHasColCount = ko.computed(function () { return self.koCellType() == "checkbox" || self.koCellType() == "radiogroup"; });
        }
        SurveyPropertyMatrixDropdownColumnsItem.prototype.hasError = function () {
            this.koHasError(!this.koName());
            return this.koHasError() || this.choicesEditor.hasError();
        };
        SurveyPropertyMatrixDropdownColumnsItem.prototype.apply = function () {
            this.column.name = this.koName();
            this.column.title = this.koTitle();
            this.column.cellType = this.koCellType();
            this.column.colCount = this.koColCount();
            //TODO
            this.column["isRequired"] = this.koIsRequired();
            this.column["hasOther"] = this.koHasOther();
            this.choicesEditor.onApplyClick();
            this.column.choices = this.choicesEditor.value;
        };
        SurveyPropertyMatrixDropdownColumnsItem.prototype.getPropertyChoices = function (propetyName) {
            var properties = Survey.JsonObject.metaData.getProperties("matrixdropdowncolumn");
            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name == propetyName)
                    return properties[i].choices;
            }
            return [];
        };
        return SurveyPropertyMatrixDropdownColumnsItem;
    }());
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="objectPropertyArrays.ts" />
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPropertyHtml = (function (_super) {
        __extends(SurveyPropertyHtml, _super);
        function SurveyPropertyHtml(onValueChanged) {
            _super.call(this, onValueChanged);
            this.onValueChanged = onValueChanged;
            this.koValue = ko.observable();
            var self = this;
            self.onApplyClick = function () { self.Apply(); };
        }
        Object.defineProperty(SurveyPropertyHtml.prototype, "value", {
            get: function () { return this.koValue(); },
            set: function (value) {
                this.koValue(value);
            },
            enumerable: true,
            configurable: true
        });
        SurveyPropertyHtml.prototype.Apply = function () {
            if (this.onValueChanged) {
                this.onValueChanged(this.value);
            }
        };
        return SurveyPropertyHtml;
    }(SurveyEditor.SurveyPropertyArray));
    SurveyEditor.SurveyPropertyHtml = SurveyPropertyHtml;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
/// <reference path="objectPropertyItemValues.ts" />
/// <reference path="objectPropertyTriggers.ts" />
/// <reference path="objectPropertyValidators.ts" />
/// <reference path="objectPropertyTextItems.ts" />
/// <reference path="objectPropertyMatrixDropdownColumns.ts" />
/// <reference path="objectPropertyHtml.ts" />
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyObjectProperty = (function () {
        function SurveyObjectProperty(property, onPropertyChanged) {
            if (onPropertyChanged === void 0) { onPropertyChanged = null; }
            this.property = property;
            this.name = this.property.name;
            this.koValue = ko.observable();
            this.editorType = property.type;
            this.choices = property.choices;
            if (this.choices != null) {
                this.editorType = "dropdown";
            }
            var self = this;
            this.arrayEditor = null;
            var onItemChanged = function (newValue) { self.koValue(newValue); };
            this.modalName = "modelEditor" + this.editorType + this.name;
            this.modalNameTarget = "#" + this.modalName;
            if (this.editorType == "itemvalues") {
                this.arrayEditor = new SurveyEditor.SurveyPropertyItemValues(function (newValue) { onItemChanged(newValue); });
            }
            if (this.editorType == "triggers") {
                this.arrayEditor = new SurveyEditor.SurveyPropertyTriggers(function (newValue) { onItemChanged(newValue); });
            }
            if (this.editorType == "validators") {
                this.arrayEditor = new SurveyEditor.SurveyPropertyValidators(function (newValue) { onItemChanged(newValue); });
            }
            if (this.editorType == "textitems") {
                this.arrayEditor = new SurveyEditor.SurveyPropertyTextItems(function (newValue) { onItemChanged(newValue); });
            }
            if (this.editorType == "matrixdropdowncolumns") {
                this.arrayEditor = new SurveyEditor.SurveyPropertyMatrixDropdownColumns(function (newValue) { onItemChanged(newValue); });
            }
            if (this.editorType == "html") {
                this.arrayEditor = new SurveyEditor.SurveyPropertyHtml(function (newValue) { onItemChanged(newValue); });
            }
            this.baseEditorType = this.arrayEditor != null ? "array" : this.editorType;
            this.koValue.subscribe(function (newValue) {
                if (self.object == null)
                    return;
                if (self.object[self.name] == newValue)
                    return;
                if (onPropertyChanged != null && !self.isValueUpdating)
                    onPropertyChanged(self, newValue);
            });
            this.koText = ko.computed(function () { return self.getValueText(self.koValue()); });
            this.koIsDefault = ko.computed(function () { return self.property.isDefaultValue(self.koValue()); });
        }
        Object.defineProperty(SurveyObjectProperty.prototype, "object", {
            get: function () { return this.objectValue; },
            set: function (value) {
                this.objectValue = value;
                this.updateValue();
            },
            enumerable: true,
            configurable: true
        });
        SurveyObjectProperty.prototype.updateValue = function () {
            this.isValueUpdating = true;
            this.koValue(this.getValue());
            if (this.arrayEditor) {
                this.arrayEditor.object = this.object;
                this.arrayEditor.title(SurveyEditor.editorLocalization.getString("pe.editProperty")["format"](this.property.name));
                this.arrayEditor.value = this.koValue();
            }
            this.isValueUpdating = false;
        };
        SurveyObjectProperty.prototype.getValue = function () {
            if (this.property.hasToUseGetValue)
                return this.property.getValue(this.object);
            return this.object[this.name];
        };
        SurveyObjectProperty.prototype.getValueText = function (value) {
            if (value != null && Array.isArray(value)) {
                return SurveyEditor.editorLocalization.getString("pe.items")["format"](value.length);
            }
            if (value != null && this.editorType == "html") {
                var str = value;
                if (str.length > 10) {
                    str = str.substr(0, 10) + "...";
                }
                return str;
            }
            return value;
        };
        return SurveyObjectProperty;
    }());
    SurveyEditor.SurveyObjectProperty = SurveyObjectProperty;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
/// <reference path="objectProperty.ts" />
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyObjectEditor = (function () {
        function SurveyObjectEditor() {
            this.onPropertyValueChanged = new Survey.Event();
            this.koProperties = ko.observableArray();
            this.koActiveProperty = ko.observable();
            this.koHasObject = ko.observable();
        }
        Object.defineProperty(SurveyObjectEditor.prototype, "selectedObject", {
            get: function () { return this.selectedObjectValue; },
            set: function (value) {
                if (this.selectedObjectValue == value)
                    return;
                this.koHasObject(value != null);
                this.selectedObjectValue = value;
                this.updateProperties();
                this.updatePropertiesObject();
            },
            enumerable: true,
            configurable: true
        });
        SurveyObjectEditor.prototype.getPropertyEditor = function (name) {
            var properties = this.koProperties();
            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name == name)
                    return properties[i];
            }
            return null;
        };
        SurveyObjectEditor.prototype.changeActiveProperty = function (property) {
            this.koActiveProperty(property);
        };
        SurveyObjectEditor.prototype.ObjectChanged = function () {
            this.updatePropertiesObject();
        };
        SurveyObjectEditor.prototype.updateProperties = function () {
            var _this = this;
            if (!this.selectedObject || !this.selectedObject.getType) {
                this.koProperties([]);
                this.koActiveProperty(null);
                return;
            }
            var properties = Survey.JsonObject.metaData.getProperties(this.selectedObject.getType());
            properties.sort(function (a, b) {
                if (a.name == b.name)
                    return 0;
                if (a.name > b.name)
                    return 1;
                return -1;
            });
            var objectProperties = [];
            var self = this;
            var propEvent = function (property, newValue) {
                self.onPropertyValueChanged.fire(_this, { property: property.property, object: property.object, newValue: newValue });
            };
            for (var i = 0; i < properties.length; i++) {
                if (!this.canShowProperty(properties[i]))
                    continue;
                var objectProperty = new SurveyEditor.SurveyObjectProperty(properties[i], propEvent);
                var locName = this.selectedObject.getType() + '_' + properties[i].name;
                objectProperty.displayName = SurveyEditor.editorLocalization.getPropertyName(locName);
                var title = SurveyEditor.editorLocalization.getPropertyTitle(locName);
                if (!title)
                    title = objectProperty.displayName;
                objectProperty.title = title;
                objectProperties.push(objectProperty);
            }
            this.koProperties(objectProperties);
            this.koActiveProperty(this.getPropertyEditor("name"));
        };
        SurveyObjectEditor.prototype.canShowProperty = function (property) {
            var name = property.name;
            if (name == 'questions' || name == 'pages')
                return false;
            return true;
        };
        SurveyObjectEditor.prototype.updatePropertiesObject = function () {
            var properties = this.koProperties();
            for (var i = 0; i < properties.length; i++) {
                properties[i].object = this.selectedObject;
            }
        };
        return SurveyObjectEditor;
    }());
    SurveyEditor.SurveyObjectEditor = SurveyObjectEditor;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyPagesEditor = (function () {
        function SurveyPagesEditor(onAddNewPageCallback, onSelectPageCallback, onMovePageCallback, onDeletePageCallback) {
            if (onAddNewPageCallback === void 0) { onAddNewPageCallback = null; }
            if (onSelectPageCallback === void 0) { onSelectPageCallback = null; }
            if (onMovePageCallback === void 0) { onMovePageCallback = null; }
            if (onDeletePageCallback === void 0) { onDeletePageCallback = null; }
            this.draggingPage = null;
            this.koPages = ko.observableArray();
            this.koIsValid = ko.observable(false);
            this.onAddNewPageCallback = onAddNewPageCallback;
            this.onSelectPageCallback = onSelectPageCallback;
            this.onMovePageCallback = onMovePageCallback;
            this.onDeletePageCallback = onDeletePageCallback;
            var self = this;
            this.selectPageClick = function (pageItem) {
                if (self.onSelectPageCallback) {
                    self.onSelectPageCallback(pageItem.page);
                }
            };
            this.keyDown = function (el, e) { self.onKeyDown(el, e); };
            this.dragStart = function (el) { self.draggingPage = el; };
            this.dragOver = function (el) { };
            this.dragEnd = function () { self.draggingPage = null; };
            this.dragDrop = function (el) { self.moveDraggingPageTo(el); };
        }
        Object.defineProperty(SurveyPagesEditor.prototype, "survey", {
            get: function () { return this.surveyValue; },
            set: function (value) {
                this.surveyValue = value;
                this.koIsValid(this.surveyValue != null);
                this.updatePages();
            },
            enumerable: true,
            configurable: true
        });
        SurveyPagesEditor.prototype.setSelectedPage = function (page) {
            var pages = this.koPages();
            for (var i = 0; i < pages.length; i++) {
                pages[i].koSelected(pages[i].page == page);
            }
        };
        SurveyPagesEditor.prototype.addNewPageClick = function () {
            if (this.onAddNewPageCallback) {
                this.onAddNewPageCallback();
            }
        };
        SurveyPagesEditor.prototype.removePage = function (page) {
            var index = this.getIndexByPage(page);
            if (index > -1) {
                this.koPages.splice(index, 1);
            }
        };
        SurveyPagesEditor.prototype.changeName = function (page) {
            var index = this.getIndexByPage(page);
            if (index > -1) {
                this.koPages()[index].title(SurveyEditor.SurveyHelper.getObjectName(page));
            }
        };
        SurveyPagesEditor.prototype.getIndexByPage = function (page) {
            var pages = this.koPages();
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].page == page)
                    return i;
            }
            return -1;
        };
        SurveyPagesEditor.prototype.onKeyDown = function (el, e) {
            if (this.koPages().length <= 1)
                return;
            var pages = this.koPages();
            var pageIndex = -1;
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].page && pages[i].koSelected()) {
                    pageIndex = i;
                }
            }
            if (pageIndex < 0)
                return;
            if (e.keyCode == 46 && this.onDeletePageCallback)
                this.onDeletePageCallback(el.page);
            if ((e.keyCode == 37 || e.keyCode == 39) && this.onSelectPageCallback) {
                pageIndex += (e.keyCode == 37 ? -1 : 1);
                if (pageIndex < 0)
                    pageIndex = pages.length - 1;
                if (pageIndex >= pages.length)
                    pageIndex = 0;
                var page = pages[pageIndex].page;
                this.onSelectPageCallback(page);
                this.setSelectedPage(page);
            }
        };
        SurveyPagesEditor.prototype.updatePages = function () {
            if (this.surveyValue == null) {
                this.koPages([]);
                return;
            }
            var pages = [];
            for (var i = 0; i < this.surveyValue.pages.length; i++) {
                var page = this.surveyValue.pages[i];
                pages.push({
                    title: ko.observable(SurveyEditor.SurveyHelper.getObjectName(page)), page: page, koSelected: ko.observable(false)
                });
            }
            this.koPages(pages);
        };
        SurveyPagesEditor.prototype.moveDraggingPageTo = function (toPage) {
            if (toPage == null || toPage == this.draggingPage) {
                this.draggingPage = null;
                return;
            }
            if (this.draggingPage == null)
                return;
            var index = this.koPages().indexOf(this.draggingPage);
            var indexTo = this.koPages().indexOf(toPage);
            if (this.onMovePageCallback) {
                this.onMovePageCallback(index, indexTo);
            }
        };
        return SurveyPagesEditor;
    }());
    SurveyEditor.SurveyPagesEditor = SurveyPagesEditor;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var TextParserPropery = (function () {
        function TextParserPropery() {
        }
        return TextParserPropery;
    }());
    var SurveyTextWorker = (function () {
        function SurveyTextWorker(text) {
            this.text = text;
            if (!this.text || this.text.trim() == "") {
                this.text = "{}";
            }
            this.errors = [];
            this.process();
        }
        Object.defineProperty(SurveyTextWorker.prototype, "survey", {
            get: function () { return this.surveyValue; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SurveyTextWorker.prototype, "isJsonCorrect", {
            get: function () { return this.surveyValue != null; },
            enumerable: true,
            configurable: true
        });
        SurveyTextWorker.prototype.process = function () {
            try {
                this.jsonValue = new SurveyEditor.SurveyJSON5(1).parse(this.text);
            }
            catch (error) {
                this.errors.push({ pos: { start: error.at, end: -1 }, text: error.message });
            }
            if (this.jsonValue != null) {
                this.updateJsonPositions(this.jsonValue);
                this.surveyValue = new Survey.Survey(this.jsonValue);
                if (this.surveyValue.jsonErrors != null) {
                    for (var i = 0; i < this.surveyValue.jsonErrors.length; i++) {
                        var error = this.surveyValue.jsonErrors[i];
                        this.errors.push({ pos: { start: error.at, end: -1 }, text: error.getFullDescription() });
                    }
                }
            }
            this.surveyObjects = this.createSurveyObjects();
            this.setEditorPositionByChartAt(this.surveyObjects);
            this.setEditorPositionByChartAt(this.errors);
        };
        SurveyTextWorker.prototype.updateJsonPositions = function (jsonObj) {
            jsonObj["pos"]["self"] = jsonObj;
            for (var key in jsonObj) {
                var obj = jsonObj[key];
                if (obj && obj["pos"]) {
                    jsonObj["pos"][key] = obj["pos"];
                    this.updateJsonPositions(obj);
                }
            }
        };
        SurveyTextWorker.prototype.createSurveyObjects = function () {
            var result = [];
            if (this.surveyValue == null)
                return result;
            this.isSurveyAsPage = false;
            for (var i = 0; i < this.surveyValue.pages.length; i++) {
                var page = this.surveyValue.pages[i];
                if (i == 0 && !page["pos"]) {
                    page["pos"] = this.surveyValue["pos"];
                    this.isSurveyAsPage = true;
                }
                result.push(page);
                for (var j = 0; j < page.questions.length; j++) {
                    result.push(page.questions[j]);
                }
            }
            return result;
        };
        SurveyTextWorker.prototype.setEditorPositionByChartAt = function (objects) {
            if (objects == null || objects.length == 0)
                return;
            var position = { row: 0, column: 0 };
            var atObjectsArray = this.getAtArray(objects);
            var startAt = 0;
            for (var i = 0; i < atObjectsArray.length; i++) {
                var at = atObjectsArray[i].at;
                position = this.getPostionByChartAt(position, startAt, at);
                var obj = atObjectsArray[i].obj;
                if (!obj.position)
                    obj.position = {};
                if (at == obj.pos.start) {
                    obj.position.start = position;
                }
                else {
                    if (at == obj.pos.end) {
                        obj.position.end = position;
                    }
                }
                startAt = at;
            }
        };
        SurveyTextWorker.prototype.getPostionByChartAt = function (startPosition, startAt, at) {
            var result = { row: startPosition.row, column: startPosition.column };
            var curChar = startAt;
            while (curChar < at) {
                if (this.text.charAt(curChar) == SurveyTextWorker.newLineChar) {
                    result.row++;
                    result.column = 0;
                }
                else {
                    result.column++;
                }
                curChar++;
            }
            return result;
        };
        SurveyTextWorker.prototype.getAtArray = function (objects) {
            var result = [];
            for (var i = 0; i < objects.length; i++) {
                var obj = objects[i];
                var pos = obj.pos;
                if (!pos)
                    continue;
                result.push({ at: pos.start, obj: obj });
                if (pos.end > 0) {
                    result.push({ at: pos.end, obj: obj });
                }
            }
            return result.sort(function (el1, el2) {
                if (el1.at > el2.at)
                    return 1;
                if (el1.at < el2.at)
                    return -1;
                return 0;
            });
        };
        return SurveyTextWorker;
    }());
    SurveyEditor.SurveyTextWorker = SurveyTextWorker;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyEmbedingWindow = (function () {
        function SurveyEmbedingWindow() {
            this.surveyId = null;
            this.surveyPostId = null;
            this.generateValidJSON = false;
            var self = this;
            this.koLibraryVersion = ko.observable("knockout");
            this.koShowAsWindow = ko.observable("page");
            this.koScriptUsing = ko.observable("bootstrap");
            this.koHasIds = ko.observable(false);
            this.koLoadSurvey = ko.observable(false);
            this.koVisibleHtml = ko.computed(function () { return self.koLibraryVersion() == "react" || self.koShowAsWindow() == "page"; });
            this.koLibraryVersion.subscribe(function (newValue) { self.setHeadText(); self.surveyEmbedingJava.setValue(self.getJavaText()); });
            this.koShowAsWindow.subscribe(function (newValue) { self.surveyEmbedingJava.setValue(self.getJavaText()); });
            this.koScriptUsing.subscribe(function (newValue) { self.setHeadText(); });
            this.koLoadSurvey.subscribe(function (newValue) { self.surveyEmbedingJava.setValue(self.getJavaText()); });
            this.surveyEmbedingHead = null;
        }
        Object.defineProperty(SurveyEmbedingWindow.prototype, "json", {
            get: function () { return this.jsonValue; },
            set: function (value) { this.jsonValue = value; },
            enumerable: true,
            configurable: true
        });
        SurveyEmbedingWindow.prototype.show = function () {
            if (this.surveyEmbedingHead == null) {
                this.surveyEmbedingHead = this.createEditor("surveyEmbedingHead");
                this.setHeadText();
                var bodyEditor = this.createEditor("surveyEmbedingBody");
                bodyEditor.setValue("<div id= \"mySurveyJSName\" ></div>");
                this.surveyEmbedingJava = this.createEditor("surveyEmbedingJava");
            }
            this.koHasIds(this.surveyId && this.surveyPostId);
            this.surveyEmbedingJava.setValue(this.getJavaText());
        };
        SurveyEmbedingWindow.prototype.setHeadText = function () {
            if (this.koLibraryVersion() == "knockout") {
                var knockoutStr = "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/knockout/3.3.0/knockout-min.js\" ></script>\n";
                if (this.koScriptUsing() == "bootstrap") {
                    this.surveyEmbedingHead.setValue(knockoutStr + "<script src=\"js/survey.bootstrap.min.js\"></script>");
                }
                else {
                    this.surveyEmbedingHead.setValue(knockoutStr + "<script src=\"js/survey.min.js\"></script>\n<link href=\"css/survey.css\" type=\"text/css\" rel=\"stylesheet\" />");
                }
            }
            else {
                var knockoutStr = "<script src=\"https://fb.me/react-0.14.8.js\"></script>\n<script src= \"https://fb.me/react-dom-0.14.8.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js\"></script>\n";
                if (this.koScriptUsing() == "bootstrap") {
                    this.surveyEmbedingHead.setValue(knockoutStr + "<script src=\"js/survey.react.bootstrap.min.js\"></script>");
                }
                else {
                    this.surveyEmbedingHead.setValue(knockoutStr + "<script src=\"js/survey.react.min.js\"></script>\n<link href=\"css/survey.css\" type=\"text/css\" rel=\"stylesheet\" />");
                }
            }
        };
        SurveyEmbedingWindow.prototype.createEditor = function (elementName) {
            var editor = ace.edit(elementName);
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/json");
            editor.setShowPrintMargin(false);
            editor.renderer.setShowGutter(false);
            editor.setReadOnly(true);
            return editor;
        };
        SurveyEmbedingWindow.prototype.getJavaText = function () {
            var isOnPage = this.koShowAsWindow() == "page";
            if (this.koLibraryVersion() == "knockout")
                return this.getKnockoutJavaText(isOnPage);
            return this.getReactJavaText(isOnPage);
        };
        SurveyEmbedingWindow.prototype.getKnockoutJavaText = function (isOnPage) {
            var text = isOnPage ? "var survey = new Survey.Survey(\n" : "var surveyWindow = new Survey.SurveyWindow(\n";
            text += this.getJsonText();
            text += ");\n";
            if (!isOnPage) {
                text += "surveyWindow.";
            }
            var saveFunc = this.getSaveFuncCode();
            text += "survey.onComplete.add(function (s) {\n" + saveFunc + "\n });\n";
            if (isOnPage) {
                text += "survey.render(\"mySurveyJSName\");";
            }
            else {
                text += "//By default Survey.title is used.\n";
                text += "//surveyWindow.title = \"My Survey Window Title.\";\n";
                text += "surveyWindow.show();";
            }
            return text;
        };
        SurveyEmbedingWindow.prototype.getReactJavaText = function (isOnPage) {
            var saveFunc = this.getSaveFuncCode();
            var sendResultText = "var surveySendResult = function (s) {\n" + saveFunc + "\n });\n";
            var name = isOnPage ? "ReactSurvey" : "ReactSurveyWindow";
            var jsonText = "var surveyJson = " + this.getJsonText() + "\n\n";
            var text = jsonText + sendResultText + "ReactDOM.render(\n<" + name + " json={surveyJson} onComplete={surveySendResult} />, \n document.getElementById(\"mySurveyJSName\"));";
            return text;
        };
        SurveyEmbedingWindow.prototype.getSaveFuncCode = function () {
            if (this.koHasIds())
                return "survey.sendResult('" + this.surveyPostId + "');";
            return "alert(\"The results are:\" + JSON.stringify(s.data));";
        };
        SurveyEmbedingWindow.prototype.getJsonText = function () {
            if (this.koHasIds() && this.koLoadSurvey()) {
                return "{ surveyId: '" + this.surveyId + "'}";
            }
            if (this.generateValidJSON)
                return JSON.stringify(this.json);
            return new SurveyEditor.SurveyJSON5().stringify(this.json);
        };
        return SurveyEmbedingWindow;
    }());
    SurveyEditor.SurveyEmbedingWindow = SurveyEmbedingWindow;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyVerbs = (function () {
        function SurveyVerbs(onModifiedCallback) {
            this.onModifiedCallback = onModifiedCallback;
            this.koVerbs = ko.observableArray();
            this.koHasVerbs = ko.observable();
            var classes = Survey.JsonObject.metaData.getChildrenClasses("selectbase", true);
            this.choicesClasses = [];
            for (var i = 0; i < classes.length; i++) {
                this.choicesClasses.push(classes[i].name);
            }
        }
        Object.defineProperty(SurveyVerbs.prototype, "survey", {
            get: function () { return this.surveyValue; },
            set: function (value) {
                if (this.survey == value)
                    return;
                this.surveyValue = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SurveyVerbs.prototype, "obj", {
            get: function () { return this.objValue; },
            set: function (value) {
                if (this.objValue == value)
                    return;
                this.objValue = value;
                this.buildVerbs();
            },
            enumerable: true,
            configurable: true
        });
        SurveyVerbs.prototype.buildVerbs = function () {
            var array = [];
            var objType = SurveyEditor.SurveyHelper.getObjectType(this.obj);
            if (objType == SurveyEditor.ObjType.Question) {
                var question = this.obj;
                if (this.survey.pages.length > 1) {
                    array.push(new SurveyVerbChangePageItem(this.survey, question, this.onModifiedCallback));
                }
                if (this.choicesClasses.indexOf(question.getType()) > -1) {
                    array.push(new SurveyVerbChangeTypeItem(this.survey, question, this.onModifiedCallback));
                }
            }
            this.koVerbs(array);
            this.koHasVerbs(array.length > 0);
        };
        return SurveyVerbs;
    }());
    SurveyEditor.SurveyVerbs = SurveyVerbs;
    var SurveyVerbItem = (function () {
        function SurveyVerbItem(survey, question, onModifiedCallback) {
            this.survey = survey;
            this.question = question;
            this.onModifiedCallback = onModifiedCallback;
            this.koItems = ko.observableArray();
            this.koSelectedItem = ko.observable();
        }
        Object.defineProperty(SurveyVerbItem.prototype, "text", {
            get: function () { return ""; },
            enumerable: true,
            configurable: true
        });
        return SurveyVerbItem;
    }());
    SurveyEditor.SurveyVerbItem = SurveyVerbItem;
    var SurveyVerbChangeTypeItem = (function (_super) {
        __extends(SurveyVerbChangeTypeItem, _super);
        function SurveyVerbChangeTypeItem(survey, question, onModifiedCallback) {
            _super.call(this, survey, question, onModifiedCallback);
            this.survey = survey;
            this.question = question;
            this.onModifiedCallback = onModifiedCallback;
            var classes = Survey.JsonObject.metaData.getChildrenClasses("selectbase", true);
            var array = [];
            for (var i = 0; i < classes.length; i++) {
                array.push({ value: classes[i].name, text: SurveyEditor.editorLocalization.getString("qt." + classes[i].name) });
            }
            this.koItems(array);
            this.koSelectedItem(question.getType());
            var self = this;
            this.koSelectedItem.subscribe(function (newValue) { self.changeType(newValue); });
        }
        Object.defineProperty(SurveyVerbChangeTypeItem.prototype, "text", {
            get: function () { return SurveyEditor.editorLocalization.getString("pe.verbChangeType"); },
            enumerable: true,
            configurable: true
        });
        SurveyVerbChangeTypeItem.prototype.changeType = function (questionType) {
            if (questionType == this.question.getType())
                return;
            var page = this.survey.getPageByQuestion(this.question);
            var index = page.questions.indexOf(this.question);
            var newQuestion = Survey.QuestionFactory.Instance.createQuestion(questionType, this.question.name);
            var jsonObj = new Survey.JsonObject();
            var json = jsonObj.toJsonObject(this.question);
            jsonObj.toObject(json, newQuestion);
            page.removeQuestion(this.question);
            page.addQuestion(newQuestion, index);
            if (this.onModifiedCallback)
                this.onModifiedCallback();
        };
        return SurveyVerbChangeTypeItem;
    }(SurveyVerbItem));
    SurveyEditor.SurveyVerbChangeTypeItem = SurveyVerbChangeTypeItem;
    var SurveyVerbChangePageItem = (function (_super) {
        __extends(SurveyVerbChangePageItem, _super);
        function SurveyVerbChangePageItem(survey, question, onModifiedCallback) {
            _super.call(this, survey, question, onModifiedCallback);
            this.survey = survey;
            this.question = question;
            this.onModifiedCallback = onModifiedCallback;
            var array = [];
            for (var i = 0; i < this.survey.pages.length; i++) {
                var page = this.survey.pages[i];
                array.push({ value: page, text: SurveyEditor.SurveyHelper.getObjectName(page) });
            }
            this.koItems(array);
            this.prevPage = this.survey.getPageByQuestion(question);
            this.koSelectedItem(this.prevPage);
            var self = this;
            this.koSelectedItem.subscribe(function (newValue) { self.changePage(newValue); });
        }
        Object.defineProperty(SurveyVerbChangePageItem.prototype, "text", {
            get: function () { return SurveyEditor.editorLocalization.getString("pe.verbChangePage"); },
            enumerable: true,
            configurable: true
        });
        SurveyVerbChangePageItem.prototype.changePage = function (newPage) {
            if (newPage == null || newPage == this.prevPage)
                return;
            this.prevPage.removeQuestion(this.question);
            newPage.addQuestion(this.question);
            if (this.onModifiedCallback)
                this.onModifiedCallback();
        };
        return SurveyVerbChangePageItem;
    }(SurveyVerbItem));
    SurveyEditor.SurveyVerbChangePageItem = SurveyVerbChangePageItem;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyUndoRedo = (function () {
        function SurveyUndoRedo() {
            this.index = -1;
            this.maximumCount = 10;
            this.items = [];
            this.koCanUndo = ko.observable(false);
            this.koCanRedo = ko.observable(false);
        }
        SurveyUndoRedo.prototype.clear = function () {
            this.items = [];
            this.koCanUndo(false);
            this.koCanRedo(false);
        };
        SurveyUndoRedo.prototype.setCurrent = function (survey, selectedObjName) {
            var item = new UndoRedoItem();
            item.surveyJSON = new Survey.JsonObject().toJsonObject(survey);
            item.selectedObjName = selectedObjName;
            if (this.index < this.items.length - 1) {
                this.items.splice(this.index + 1);
            }
            this.items.push(item);
            this.removeOldData();
            this.index = this.items.length - 1;
            this.updateCanUndoRedo();
        };
        SurveyUndoRedo.prototype.undo = function () {
            if (!this.canUndo)
                return null;
            return this.doUndoRedo(-1);
        };
        SurveyUndoRedo.prototype.redo = function () {
            if (!this.canRedo)
                return null;
            return this.doUndoRedo(1);
        };
        SurveyUndoRedo.prototype.updateCanUndoRedo = function () {
            this.koCanUndo(this.canUndo);
            this.koCanRedo(this.canRedo);
        };
        SurveyUndoRedo.prototype.doUndoRedo = function (dIndex) {
            this.index += dIndex;
            this.updateCanUndoRedo();
            return this.index >= 0 && this.index < this.items.length ? this.items[this.index] : null;
        };
        Object.defineProperty(SurveyUndoRedo.prototype, "canUndo", {
            get: function () {
                return this.index >= 1 && this.index < this.items.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SurveyUndoRedo.prototype, "canRedo", {
            get: function () {
                return this.items.length > 1 && this.index < this.items.length - 1;
            },
            enumerable: true,
            configurable: true
        });
        SurveyUndoRedo.prototype.removeOldData = function () {
            if (this.items.length - 1 < this.maximumCount)
                return;
            this.items.splice(0, this.items.length - this.maximumCount - 1);
        };
        return SurveyUndoRedo;
    }());
    SurveyEditor.SurveyUndoRedo = SurveyUndoRedo;
    var UndoRedoItem = (function () {
        function UndoRedoItem() {
        }
        return UndoRedoItem;
    }());
    SurveyEditor.UndoRedoItem = UndoRedoItem;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var templateEditor;
(function (templateEditor) {
    var ko;
    (function (ko) {
        ko.html = '<div class="row nav-tabs">    <div class="col-md-6">        <nav class="navbar-default">            <div class="container-fluid">                <div class="collapse navbar-collapse">                    <ul class="nav nav-tabs no-borders">                        <li data-bind="css: {active: koIsShowDesigner()}"><a href="#" data-bind="click:selectDesignerClick, text: $root.getLocString(\'ed.designer\')"></a></li>                        <li data-bind="css: {active: !koIsShowDesigner()}"><a href="#" data-bind="click:selectEditorClick, text: $root.getLocString(\'ed.jsonEditor\')"></a></li>                        <li data-bind="visible: koIsShowDesigner" style="margin-left:5px"><button type="button" class="btn btn-default" data-bind="enable:undoRedo.koCanUndo, click: doUndoClick"><span data-bind="text: $root.getLocString(\'ed.undo\')"></span></button></li>                        <li data-bind="visible: koIsShowDesigner" style="margin-left:5px"><button type="button" class="btn btn-default" data-bind="enable:undoRedo.koCanRedo, click: doRedoClick"><span data-bind="text: $root.getLocString(\'ed.redo\')"></span></button></li>                        <li data-bind="visible: koIsShowDesigner() && koShowOptions()" style="margin-left:5px">                            <div class="btn-group">                                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-bind="text: $root.getLocString(\'ed.options\')">                                    Options <span class="caret"></span>                                </button>                                <ul class="dropdown-menu">                                    <li data-bind="css: {active: koGenerateValidJSON}"><a href="#" data-bind="click:generateValidJSONClick, text: $root.getLocString(\'ed.generateValidJSON\')"></a></li>                                    <li data-bind="css: {active: !koGenerateValidJSON()}"><a href="#" data-bind="click:generateReadableJSONClick, text: $root.getLocString(\'ed.generateReadableJSON\')"></a></li>                                </ul>                            </div>                        </li>                    </ul>                 </div>            </div>        </nav>    </div>    <div class="col-md-6 svd_navbarbuttons">        <nav class="navbar-default pull-right">            <div class="btn-toolbar" role="toolbar">                <button type="button" class="btn btn-default" data-bind="click: runSurveyClick" data-toggle="modal" data-target="#surveyExampleModal"><span class="glyphicon glyphicon-play" aria-hidden="true"></span><span data-bind="text: $root.getLocString(\'ed.runSurvey\')"></span></button>                <button type="button" class="btn btn-default" data-bind="click: embedingSurveyClick" data-toggle="modal" data-target="#surveyEmbedingModal"><span data-bind="text: $root.getLocString(\'ed.embedSurvey\')"></span></button>                <button type="button" class="btn btn-default" data-bind="visible: koShowSaveButton, click: saveButtonClick"><span data-bind="text: $root.getLocString(\'ed.saveSurvey\')"></span></button>            </div>        </nav>    </div>    </div>        <div class="panel" style="width:100%">            <div id="surveyjsEditor" data-bind="visible: !koIsShowDesigner()" style="height:450px;width:100%"></div>            <div class="row" data-bind="visible: koIsShowDesigner()">                <div class="row col-md-9">                    <div class="col-md-3">                        <div class="panel panel-default" style="width:100%">                            <div class="panel-heading">                                <b data-bind="text: $root.getLocString(\'ed.toolbox\')"></b>                            </div>                            <div class="btn-group-vertical" style="width:100%;padding-right:2px">                                <!-- ko foreach: questionTypes -->                                <div class="btn btn-default" style="text-align:left; padding-left:10px; margin:1px;width:100%" draggable="true" data-bind="click: $parent.clickQuestion, event:{dragstart: function(el, e) { $parent.draggingQuestion($data, e); return true;}}">                                    <span data-bind="text: $root.getLocString(\'qt.\' + $data)"></span>                                </div>                                <!-- /ko  -->                                <!-- ko foreach: koCopiedQuestions -->                                <div class="btn btn-primary" style="text-align:left; padding-left:10px; margin:1px;width:100%" draggable="true" data-bind="click: $parent.clickCopiedQuestion, event:{dragstart: function(el, e) { $parent.draggingCopiedQuestion($data, e); return true;}}">                                    <span data-bind="text:name"></span>                                </div>                                <!-- /ko  -->                            </div>                        </div>                    </div>                    <div class="col-md-9">                        <div data-bind="template: { name: \'pageeditor\', data: pagesEditor }"></div>                        <div style="overflow-y: scroll;height:450px;">                            <div id="surveyjs" style="width:100%"></div>                        </div>                    </div>                </div>                <div class="col-md-3">                    <div class="panel panel-default" style="width:100%">                        <div class="panel-heading">                            <div class="input-group">                                <select class="form-control" data-bind="options: koObjects, optionsText: \'text\', value: koSelectedObject"></select>                                <span class="input-group-btn">                                    <button class="btn btn-default" type="button" data-bind="enable: koCanDeleteObject, click: deleteCurrentObject, attr: { title: $root.getLocString(\'ed.delSelObject\')}"><span class="glyphicon glyphicon-remove"></span></button>                                </span>                            </div>                        </div>                        <div data-bind="template: { name: \'objecteditor\', data: selectedObjectEditor }"></div>                        <div class="panel-footer" data-bind="visible:surveyVerbs.koHasVerbs">                            <div data-bind="template: { name: \'objectverbs\', data: surveyVerbs }"></div>                        </div>                    </div>                </div>            </div>        </div>        <div id="surveyExampleModal" class="modal fade" role="dialog">            <div class="modal-dialog">                <div class="modal-content">                    <div class="modal-header">                        <button type="button" class="close" data-dismiss="modal">&times;</button>                        <h4 class="modal-title" data-bind="text: $root.getLocString(\'ed.runSurvey\')"></h4>                    </div>                    <div class="modal-body">                        <div id="surveyjsExample"></div>                        <div id="surveyjsExampleResults"></div>                    </div>                </div>            </div>        </div>        <div id="surveyEmbedingModal" class="modal fade" role="dialog">            <div class="modal-dialog">                <div class="modal-content">                    <div class="modal-header">                        <button type="button" class="close" data-dismiss="modal">&times;</button>                        <h4 class="modal-title" data-bind="text: $root.getLocString(\'ed.embedSurvey\')"></h4>                    </div>                    <div class="modal-body">                        <div data-bind="template: { name: \'surveyembeding\', data: surveyEmbeding }"></div>                    </div>                </div>            </div>        </div><script type="text/html" id="objecteditor">    <table class="table svd_table-nowrap">        <tbody data-bind="foreach: koProperties">            <tr data-bind="click: $parent.changeActiveProperty($data), css: {\'active\': $parent.koActiveProperty() == $data}">                <td data-bind="text: displayName, attr: {title: title}" width="50%"></td>                <td width="50%">                    <span data-bind="text: koText, visible: $parent.koActiveProperty() != $data, attr: {title: koText}, style: {color: koIsDefault() ? \'gray\' : \'\'}" style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden"></span>                    <div data-bind="visible: $parent.koActiveProperty() == $data">                        <!-- ko template: { name: \'propertyeditor-\' + baseEditorType, data: $data } -->                        <!-- /ko -->                    </div>                </td>            </tr>        </tbody>    </table></script><script type="text/html" id="objectverbs">    <!-- ko foreach: koVerbs -->        <div class="row">            <div class="input-group">                <span  class="input-group-addon" data-bind="text:text"></span>                <select class="form-control" data-bind="options: koItems, optionsText: \'text\', optionsValue:\'value\', value: koSelectedItem"></select>            </div>        </div>    <!-- /ko  --></script><script type="text/html" id="pageeditor">    <ul class="nav nav-tabs" data-bind="tabs:true">        <!-- ko foreach: koPages -->        <li data-bind="css: {active: koSelected()},event:{           keydown:function(el, e){ $parent.keyDown(el, e); },           dragstart:function(el, e){ $parent.dragStart(el); return true; },           dragover:function(el, e){ $parent.dragOver(el);},           dragend:function(el, e){ $parent.dragEnd();},           drop:function(el, e){ $parent.dragDrop(el);}         }">             <a href="#" data-bind="click:$parent.selectPageClick">                <span data-bind="text: title"></span>            </a>        </li>        <!-- /ko  -->        <li><button type="button" class="btn btn-default" data-bind="click:addNewPageClick"><span class="glyphicon glyphicon-plus"></span></button></li>    </ul></script><script type="text/html" id="propertyeditor-array">    <div>        <span data-bind="text: koText"></span>        <button type="button" class="btn btn-default" data-toggle="modal" data-bind="attr: {\'data-target\' : modalNameTarget}, text: $root.getLocString(\'pe.edit\')"></button>    </div>    <div data-bind="attr: {id : modalName}" class="modal fade" role="dialog">        <div class="modal-dialog">            <div class="modal-content">                <div class="modal-header">                    <button type="button" class="close" data-dismiss="modal">&times;</button>                    <h4 class="modal-title" data-bind="text:arrayEditor.title"></h4>                </div>                  <div class="modal-body svd_notopbottompaddings">                    <!-- ko template: { name: \'propertyeditor-\' + editorType, data: arrayEditor } -->                    <!-- /ko -->                </div>                <div class="modal-footer">                    <input type="button" class="btn btn-primary" data-bind="click: arrayEditor.onApplyClick, value: $root.getLocString(\'pe.apply\')" style="width:100px" />                    <input type="button" class="btn btn-default" data-dismiss="modal" data-bind="value: $root.getLocString(\'pe.close\')" style="width:100px" />                </div>            </div>        </div>    </div></script><script type="text/html" id="propertyeditor-boolean">    <input type="checkbox" data-bind="checked: koValue" /></script><script type="text/html" id="propertyeditor-dropdown">    <select data-bind="value: koValue, options: choices"  style="width:100%"></select></script><script type="text/html" id="propertyeditor-html">    <textarea data-bind="value:koValue" style="width:100%" rows="10"></textarea></script><script type="text/html" id="propertyeditor-itemvalues"><table class="table">    <thead>        <tr>            <th data-bind="text: $root.getLocString(\'pe.value\')"></th>            <th data-bind="text: $root.getLocString(\'pe.text\')"></th>            <th></th>        </tr>    </thead>    <tbody>        <!-- ko foreach: koItems -->        <tr>            <td>                <input type="text" class="form-control" data-bind="value:koValue" style="width:200px" />                <div class="alert alert-danger no-padding" role="alert" data-bind="visible:koHasError, text: $root.getLocString(\'pe.enterNewValue\')"></div>            </td>            <td><input type="text" class="form-control" data-bind="value:koText" style="width:200px" /></td>            <td><input type="button" class="btn" data-bind="click: $parent.onDeleteClick, value: $root.getLocString(\'pe.delete\')"/></td>        </tr>        <!-- /ko -->        <tr>            <td colspan="3">                <div class="row btn-toolbar">                    <input type="button" class="btn btn-success" data-bind="click: onAddClick, value: $root.getLocString(\'pe.addNew\')" />                    <input type="button" class="btn btn-danger" data-bind="click: onClearClick, value: $root.getLocString(\'pe.removeAll\')"/>                </div>            </td>        </tr>    </tbody></table></script><script type="text/html" id="propertyeditor-matrixdropdowncolumns">    <table class="table">        <thead>            <tr>                <th data-bind="text: $root.getLocString(\'pe.required\')"></th>                <th data-bind="text: $root.getLocString(\'pe.cellType\')"></th>                <th data-bind="text: $root.getLocString(\'pe.name\')"></th>                <th data-bind="text: $root.getLocString(\'pe.title\')"></th>                <th></th>            </tr>        </thead>        <tbody>            <!-- ko foreach: koItems -->            <tr>                <td>                    <a href="#" data-bind="visible:koHasChoices, click: onShowChoicesClick">                        <span class="glyphicon" data-bind="css: {\'glyphicon-chevron-down\': !koShowChoices(), \'glyphicon-chevron-up\': koShowChoices()}"></span>                    </a>                    <input type="checkbox" data-bind="checked: koIsRequired" />                </td>                <td>                    <select class="form-control" data-bind="options: cellTypeChoices, value: koCellType"  style="width:110px"></select>                </td>                <td>                    <input type="text" class="form-control" data-bind="value:koName" style="width:100px" />                    <div class="alert alert-danger no-padding" role="alert" data-bind="visible:koHasError, text: $root.getLocString(\'pe.enterNewValue\')"></div>                </td>                <td><input type="text" class="form-control" data-bind="value:koTitle" style="width:120px" /></td>                <td><input type="button" class="btn" data-bind="click: $parent.onDeleteClick, value: $root.getLocString(\'pe.delete\')"/></td>            </tr>            <tr data-bind="visible: koShowChoices() && koHasChoices()">                <td colspan="4" style="border-top-style:none">                    <div class="form-group">                        <label class="control-label col-sm-3" data-bind="text:$root.getLocString(\'pe.hasOther\')"></label>                        <div class="col-sm-2">                            <input type="checkbox" data-bind="checked: koHasOther" />                        </div>                        <div class="col-sm-7" data-bind="visible: !koHasColCount()"></div>                        <label class="control-label col-sm-3" data-bind="visible:koHasColCount, text:$root.getLocString(\'pe.colCount\')"></label>                        <select class="form-control col-sm-4" data-bind="visible:koHasColCount, options: colCountChoices, value: koColCount" style="width:110px"></select>                    </div>                    <!-- ko template: { name: \'propertyeditor-itemvalues\', data: choicesEditor } -->                    <!-- /ko -->                </td>            </tr>            <!-- /ko -->            <tr>                <td colspan="3">                    <div class="row btn-toolbar">                        <input type="button" class="btn btn-success" data-bind="click: onAddClick, value: $root.getLocString(\'pe.addNew\')"/>                        <input type="button" class="btn btn-danger" data-bind="click: onClearClick, value: $root.getLocString(\'pe.removeAll\')"" />                    </div>                </td>            </tr>        </tbody>    </table></script><script type="text/html" id="propertyeditor-number">    <input type="number" data-bind="value: koValue" style="width:100%" /></script><script type="text/html" id="propertyeditor-string">    <input type="text" data-bind="value: koValue" style="width:100%" /></script><script type="text/html" id="propertyeditor-textitems"><div class="panel">    <table class="table">        <thead>            <tr>                <th data-bind="text: $root.getLocString(\'pe.name\')"></th>                <th data-bind="text: $root.getLocString(\'pe.title\')"></th>                <th></th>            </tr>        </thead>        <tbody>            <!-- ko foreach: koItems -->            <tr>                <td><input type="text" class="form-control" data-bind="value:koName" style="width:200px" /></td>                <td><input type="text" class="form-control" data-bind="value:koTitle" style="width:200px" /></td>                <td><input type="button" class="btn" data-bind="click: $parent.onDeleteClick, value: $root.getLocString(\'pe.delete\')"/></td>            </tr>            <!-- /ko -->            <tr>                <td colspan="4"><input type="button" class="btn btn-success" data-bind="click: onAddClick, value: $root.getLocString(\'pe.addNew\')"/></td>            </tr>        </tbody>    </table></div></script><script type="text/html" id="propertyeditor-triggers"><div class="panel">    <div class="panel-heading">        <div class="row input-group">            <button type="button" class="dropdown-toggle input-group-addon" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">                <span class="glyphicon glyphicon-plus"></span>            </button>            <ul class="dropdown-menu input-group">                <!-- ko foreach: availableTriggers -->                <li><a href="#" data-bind="click: $parent.onAddClick($data)"><span data-bind="text:$data"></span></a></li>                <!-- /ko  -->            </ul>            <select class="form-control" data-bind="options: koItems, optionsText: \'koText\', value: koSelected"></select>            <span class="input-group-btn">                <button type="button" data-bind="enable: koSelected() != null, click: onDeleteClick" class="btn btn-default"><span class="glyphicon glyphicon-remove"></span></button>            </span>        </div>    </div>    <div data-bind="visible: koSelected() == null">        <div data-bind="visible: koQuestions().length == 0, text: $root.getLocString(\'pe.noquestions\')"></div>        <div data-bind="visible: koQuestions().length > 0, text: $root.getLocString(\'pe.createtrigger\')"></div>    </div>    <div data-bind="visible: koSelected() != null">        <div data-bind="with: koSelected">            <div class="row form-inline">                <div class="col-sm-4">                    <span data-bind="text: $root.getLocString(\'pe.triggerOn\')"></span><select class="form-control" data-bind="options:$parent.koQuestions, value: koName"></select> <span> </span>                </div>                <div class="col-sm-4">                    <select class="form-control" data-bind="options:availableOperators, optionsValue: \'name\', optionsText: \'text\', value:koOperator"></select>                </div>                <div class="col-sm-4">                    <input class="form-control" style="padding: 0" type="text" data-bind="visible: koRequireValue, value:koValue" />                </div>            </div>            <!-- ko if: koType() == \'visibletrigger\' -->            <div class="row">                <div class="col-sm-6">                    <!-- ko template: { name: \'propertyeditor-triggersitems\', data: pages } -->                    <!-- /ko -->                </div>                <div class="col-sm-6">                    <!-- ko template: { name: \'propertyeditor-triggersitems\', data: questions } -->                    <!-- /ko -->                </div>            </div>            <!-- /ko -->            <!-- ko if: koType() == \'completetrigger\' -->            <div class="row">               <div style="margin: 10px" data-bind="text: $root.getLocString(\'pe.triggerCompleteText\')"></div>            </div>            <!-- /ko -->            <!-- ko if: koType() == \'setvaluetrigger\' -->            <div class="row form-inline" style="margin-top:10px">                <div class="col-sm-6">                    <span data-bind="text: $root.getLocString(\'pe.triggerSetToName\')"></span><input class="form-control" type="text" data-bind="value:kosetToName" />                </div>                <div class="col-sm-1">                </div>                <div class="col-sm-5">                    <span data-bind="text: $root.getLocString(\'pe.triggerSetValue\')"></span><input class="form-control" type="text" data-bind="value:kosetValue" />                </div>            </div>            <div class="row form-inline">                <div class="col-sm-12">                    <input type="checkbox" data-bind="checked: koisVariable" /> <span data-bind="text: $root.getLocString(\'pe.triggerIsVariable\')"></span>                </div>            </div>            <!-- /ko -->        </div>    </div></div></script><script type="text/html" id="propertyeditor-triggersitems">    <div class="panel no-margins no-padding">        <div class="panel-heading">            <span data-bind="text: title"></span>        </div>        <div class="input-group">            <select class="form-control" multiple="multiple" data-bind="options:koChoosen, value: koChoosenSelected"></select>            <span class="input-group-btn" style="vertical-align:top">                <button type="button" data-bind="enable: koChoosenSelected() != null, click: onDeleteClick" class="btn"><span class="glyphicon glyphicon-remove"></span></button>            </span>        </div>        <div class="input-group" style="margin-top:5px">            <select class="form-control" data-bind="options:koObjects, value: koSelected"></select>            <span class="input-group-btn">                <button type="button" data-bind="enable: koSelected() != null, click: onAddClick" style="width:40px" class="btn btn-success"><span class="glyphicon glyphicon-plus"></span></button>            </span>        </div>    </div></script><script type="text/html" id="propertyeditor-validators"><div class="panel">    <div class="panel-heading">        <div class="row input-group">            <button type="button" class="dropdown-toggle input-group-addon" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">                <span class="glyphicon glyphicon-plus"></span>            </button>            <ul class="dropdown-menu input-group">                <!-- ko foreach: availableValidators -->                <li><a href="#" data-bind="click: $parent.onAddClick($data)"><span data-bind="text:$data"></span></a></li>                <!-- /ko  -->            </ul>            <select class="form-control" data-bind="options: koItems, optionsText: \'text\', value: koSelected"></select>            <span class="input-group-btn">                <button type="button" data-bind="enable: koSelected() != null, click: onDeleteClick" class="btn"><span class="glyphicon glyphicon-remove"></span></button>            </span>        </div>    </div>    <div data-bind="template: { name: \'objecteditor\', data: selectedObjectEditor }"></div></div></script><script type="text/html" id="surveyembeding">    <div class="row">        <select data-bind="value:koLibraryVersion">            <option value="knockout" data-bind="text: $root.getLocString(\'ew.knockout\')"></option>            <option value="react" data-bind="text: $root.getLocString(\'ew.react\')"></option>        </select>        <select data-bind="value:koScriptUsing">            <option value="bootstrap" data-bind="text: $root.getLocString(\'ew.bootstrap\')"></option>            <option value="standard" data-bind="text: $root.getLocString(\'ew.standard\')"></option>        </select>        <select data-bind="value:koShowAsWindow">            <option value="page" data-bind="text: $root.getLocString(\'ew.showOnPage\')"></option>            <option value="window" data-bind="text: $root.getLocString(\'ew.showInWindow\')"></option>        </select>        <label class="checkbox-inline" data-bind="visible:koHasIds">            <input type="checkbox" data-bind="checked:koLoadSurvey" />            <span data-bind="text: $root.getLocString(\'ew.loadFromServer\')"></span>        </label>    </div>    <div class="panel">        <div class="panel-heading" data-bind="text: $root.getLocString(\'ew.titleScript\')"></div>        <div id="surveyEmbedingHead" style="height:70px;width:100%"></div>    </div>    <div class="panel" data-bind="visible: koVisibleHtml">        <div class="panel-heading"  data-bind="text: $root.getLocString(\'ew.titleHtml\')"></div>        <div id="surveyEmbedingBody" style="height:30px;width:100%"></div>    </div>    <div class="panel">        <div class="panel-heading"  data-bind="text: $root.getLocString(\'ew.titleJavaScript\')"></div>        <div id="surveyEmbedingJava" style="height:300px;width:100%"></div>    </div></script>';
    })(ko = templateEditor.ko || (templateEditor.ko = {}));
})(templateEditor || (templateEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var template_page;
(function (template_page) {
    template_page.html = '<div data-bind="event:{           dragenter:function(el, e){ dragEnter(e);},           dragleave:function(el, e){ dragLeave(e);},           dragover:function(el, e){ return false;},           drop:function(el, e){ dragDrop(e);}}     ">    <h4 data-bind="visible: (title.length > 0) && data.showPageTitles, text: koNo() + title"></h4>    <!-- ko foreach: { data: questions, as: \'question\' } -->    <div class="svd_dragover" data-bind="visible:$parent.koDragging() == $index()"></div>    <!-- ko template: { name: \'survey-question\', data: question } -->    <!-- /ko -->    <!-- /ko -->    <div class="well" data-bind="visible:$root.isDesignMode && questions.length == 0">        <span data-bind="text:$root.getEditorLocString(\'survey.dropQuestion\')"></span>    </div>    <div class="svd_dragover" data-bind="visible:koDragging() == questions.length"></div></div>';
})(template_page || (template_page = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var template_question;
(function (template_question) {
    template_question.html = '<div class="well well-sm" data-bind="style: {marginLeft: question.koMarginLeft },      attr : {id: id, draggable: $root.isDesignMode}, visible: question.koVisible() || $root.isDesignMode, click: $root.isDesignMode ? koOnClick: null,          event:{           dragstart:function(el, e){ dragStart(e); return true; },           dragover:function(el, e){ dragOver(e);},           drop:function(el, e){ dragDrop(e);}         }, css:{svd_q_design_border: $root.isDesignMode, svd_q_selected : koIsSelected}">    <div class="svd_q_copybutton" data-bind="visible: koIsSelected">        <button class="btn btn-primary btn-xs" data-bind="click: $root.copyQuestionClick, text:$root.getEditorLocString(\'survey.copy\')"></button>    </div>    <div data-bind="css:{svd_q_design: $root.isDesignMode}">        <div class="alert alert-danger" role="alert" data-bind="visible: koErrors().length > 0, foreach: koErrors">            <div>                <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>                <span data-bind="text:$data.getText()"></span>            </div>        </div>        <!-- ko if: question.hasTitle -->        <h5 data-bind="text: question.koTitle, css: $root.css.question.title"></h5>        <!-- /ko -->        <!-- ko template: { name: \'survey-question-\' + question.getType(), data: question } -->        <!-- /ko -->        <div data-bind="visible: question.hasComment">            <div data-bind="text:question.commentText"></div>            <div data-bind="template: { name: \'survey-comment\', data: {\'question\': question, \'visible\': true } }"></div>        </div>    </div></div>';
})(template_question || (template_question = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
/// <reference path="objectEditor.ts" />
/// <reference path="pagesEditor.ts" />
/// <reference path="textWorker.ts" />
/// <reference path="surveyHelper.ts" />
/// <reference path="surveyEmbedingWindow.ts" />
/// <reference path="objectVerbs.ts" />
/// <reference path="dragdrophelper.ts" />
/// <reference path="undoredo.ts" />
/// <reference path="templateEditor.ko.html.ts" />
/// <reference path="template_page.html.ts" />
/// <reference path="template_question.html.ts" />
var SurveyEditor;
(function (SurveyEditor_1) {
    var SurveyEditor = (function () {
        function SurveyEditor(renderedElement, options) {
            if (renderedElement === void 0) { renderedElement = null; }
            if (options === void 0) { options = null; }
            this.stateValue = "";
            this.surveyId = null;
            this.surveyPostId = null;
            this.saveNo = 0;
            this.timeoutId = -1;
            this.options = options;
            this.questionTypes = this.getQuestionTypes();
            this.koCopiedQuestions = ko.observableArray();
            this.koCanDeleteObject = ko.observable(false);
            var self = this;
            this.koState = ko.observable();
            this.koShowSaveButton = ko.observable(false);
            this.koShowOptions = ko.observable(false);
            this.saveButtonClick = function () { self.doSave(); };
            this.koObjects = ko.observableArray();
            this.koSelectedObject = ko.observable();
            this.koSelectedObject.subscribe(function (newValue) { self.selectedObjectChanged(newValue != null ? newValue.value : null); });
            this.koGenerateValidJSON = ko.observable(this.options && this.options.generateValidJSON);
            this.koGenerateValidJSON.subscribe(function (newValue) {
                if (!self.options)
                    self.options = {};
                self.options.generateValidJSON = newValue;
                if (self.generateValidJSONChangedCallback)
                    self.generateValidJSONChangedCallback(newValue);
            });
            this.surveyObjects = new SurveyEditor_1.SurveyObjects(this.koObjects, this.koSelectedObject);
            this.undoRedo = new SurveyEditor_1.SurveyUndoRedo();
            this.surveyVerbs = new SurveyEditor_1.SurveyVerbs(function () { self.setModified(); });
            this.selectedObjectEditor = new SurveyEditor_1.SurveyObjectEditor();
            this.selectedObjectEditor.onPropertyValueChanged.add(function (sender, options) {
                self.onPropertyValueChanged(options.property, options.object, options.newValue);
            });
            this.pagesEditor = new SurveyEditor_1.SurveyPagesEditor(function () { self.addPage(); }, function (page) { self.surveyObjects.selectObject(page); }, function (indexFrom, indexTo) { self.movePage(indexFrom, indexTo); }, function (page) { self.deleteCurrentObject(); });
            this.surveyEmbeding = new SurveyEditor_1.SurveyEmbedingWindow();
            this.koIsShowDesigner = ko.observable(true);
            this.selectDesignerClick = function () { self.showDesigner(); };
            this.selectEditorClick = function () { self.showJsonEditor(); };
            this.generateValidJSONClick = function () { self.koGenerateValidJSON(true); };
            this.generateReadableJSONClick = function () { self.koGenerateValidJSON(false); };
            this.runSurveyClick = function () { self.showLiveSurvey(); };
            this.embedingSurveyClick = function () { self.showSurveyEmbeding(); };
            this.deleteObjectClick = function () { self.deleteCurrentObject(); };
            this.draggingQuestion = function (questionType, e) { self.doDraggingQuestion(questionType, e); };
            this.clickQuestion = function (questionType) { self.doClickQuestion(questionType); };
            this.draggingCopiedQuestion = function (item, e) { self.doDraggingCopiedQuestion(item.json, e); };
            this.clickCopiedQuestion = function (item) { self.doClickCopiedQuestion(item.json); };
            this.doUndoClick = function () { self.doUndoRedo(self.undoRedo.undo()); };
            this.doRedoClick = function () { self.doUndoRedo(self.undoRedo.redo()); };
            if (renderedElement) {
                this.render(renderedElement);
            }
        }
        Object.defineProperty(SurveyEditor.prototype, "survey", {
            get: function () {
                return this.surveyValue;
            },
            enumerable: true,
            configurable: true
        });
        SurveyEditor.prototype.render = function (element) {
            if (element === void 0) { element = null; }
            var self = this;
            if (element && typeof element == "string") {
                element = document.getElementById(element);
            }
            if (element) {
                this.renderedElement = element;
            }
            element = this.renderedElement;
            if (!element)
                return;
            element.innerHTML = templateEditor.ko.html;
            self.applyBinding();
        };
        SurveyEditor.prototype.loadSurvey = function (surveyId) {
            var self = this;
            new Survey.dxSurveyService().loadSurvey(surveyId, function (success, result, response) {
                if (success && result) {
                    self.text = JSON.stringify(result);
                }
            });
        };
        Object.defineProperty(SurveyEditor.prototype, "text", {
            get: function () {
                if (this.koIsShowDesigner())
                    return this.getSurveyTextFromDesigner();
                return this.jsonEditor != null ? this.jsonEditor.getValue() : "";
            },
            set: function (value) {
                this.textWorker = new SurveyEditor_1.SurveyTextWorker(value);
                if (this.textWorker.isJsonCorrect) {
                    this.showDesigner();
                }
                else {
                    this.setTextValue(value);
                    this.koIsShowDesigner(false);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SurveyEditor.prototype, "state", {
            get: function () { return this.stateValue; },
            enumerable: true,
            configurable: true
        });
        SurveyEditor.prototype.setState = function (value) {
            this.stateValue = value;
            this.koState(this.state);
        };
        SurveyEditor.prototype.doSave = function () {
            this.setState("saving");
            if (this.saveSurveyFunc) {
                this.saveNo++;
                var self = this;
                this.saveSurveyFunc(this.saveNo, function doSaveCallback(no, isSuccess) {
                    self.setState("saved");
                    if (self.saveNo == no) {
                        if (isSuccess)
                            self.setState("saved");
                    }
                });
            }
        };
        SurveyEditor.prototype.setModified = function () {
            this.setState("modified");
            this.setUndoRedoCurrentState();
        };
        SurveyEditor.prototype.setUndoRedoCurrentState = function (clearState) {
            if (clearState === void 0) { clearState = false; }
            if (clearState) {
                this.undoRedo.clear();
            }
            var selObj = this.koSelectedObject() ? this.koSelectedObject().value : null;
            this.undoRedo.setCurrent(this.surveyValue, selObj ? selObj.name : null);
        };
        Object.defineProperty(SurveyEditor.prototype, "saveSurveyFunc", {
            get: function () { return this.saveSurveyFuncValue; },
            set: function (value) {
                this.saveSurveyFuncValue = value;
                this.koShowSaveButton(value != null);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SurveyEditor.prototype, "showOptions", {
            get: function () { return this.koShowOptions(); },
            set: function (value) { this.koShowOptions(value); },
            enumerable: true,
            configurable: true
        });
        SurveyEditor.prototype.setTextValue = function (value) {
            if (this.jsonEditor == null)
                return;
            this.isProcessingImmediately = true;
            this.jsonEditor.setValue(value);
            this.jsonEditor.renderer.updateFull(true);
            this.processJson(value);
            this.isProcessingImmediately = false;
        };
        SurveyEditor.prototype.addPage = function () {
            var name = SurveyEditor_1.SurveyHelper.getNewPageName(this.survey.pages);
            var page = this.surveyValue.addNewPage(name);
            this.addPageToUI(page);
            this.setModified();
        };
        SurveyEditor.prototype.getLocString = function (str) { return SurveyEditor_1.editorLocalization.getString(str); };
        SurveyEditor.prototype.getQuestionTypes = function () {
            var allTypes = Survey.QuestionFactory.Instance.getAllTypes();
            if (!this.options || !this.options.questionTypes || !this.options.questionTypes.length)
                return allTypes;
            var result = [];
            for (var i = 0; i < this.options.questionTypes.length; i++) {
                var questionType = this.options.questionTypes[i];
                if (allTypes.indexOf(questionType) > -1) {
                    result.push(questionType);
                }
            }
            return result;
        };
        SurveyEditor.prototype.movePage = function (indexFrom, indexTo) {
            var page = this.survey.pages[indexFrom];
            this.survey.pages.splice(indexFrom, 1);
            this.survey.pages.splice(indexTo, 0, page);
            this.pagesEditor.survey = this.survey;
            this.surveyObjects.selectObject(page);
            this.setModified();
        };
        SurveyEditor.prototype.addPageToUI = function (page) {
            this.pagesEditor.survey = this.surveyValue;
            this.surveyObjects.addPage(page);
        };
        SurveyEditor.prototype.onQuestionAdded = function (question) {
            var page = this.survey.getPageByQuestion(question);
            this.surveyObjects.addQuestion(page, question);
            this.survey.render();
        };
        SurveyEditor.prototype.onQuestionRemoved = function (question) {
            this.surveyObjects.removeObject(question);
            this.survey.render();
        };
        SurveyEditor.prototype.onPropertyValueChanged = function (property, obj, newValue) {
            var isDefault = property.isDefaultValue(newValue);
            obj[property.name] = newValue;
            if (property.name == "name") {
                this.surveyObjects.nameChanged(obj);
                if (SurveyEditor_1.SurveyHelper.getObjectType(obj) == SurveyEditor_1.ObjType.Page) {
                    this.pagesEditor.changeName(obj);
                }
            }
            this.setModified();
            this.survey.render();
        };
        SurveyEditor.prototype.doUndoRedo = function (item) {
            this.initSurvey(item.surveyJSON);
            if (item.selectedObjName) {
                var selObj = this.findObjByName(item.selectedObjName);
                if (selObj) {
                    this.surveyObjects.selectObject(selObj);
                }
            }
        };
        SurveyEditor.prototype.findObjByName = function (name) {
            var page = this.survey.getPageByName(name);
            if (page)
                return page;
            var question = this.survey.getQuestionByName(name);
            if (question)
                return question;
            return null;
        };
        SurveyEditor.prototype.showDesigner = function () {
            if (!this.textWorker.isJsonCorrect) {
                alert(this.getLocString("ed.correctJSON"));
                return;
            }
            this.initSurvey(new Survey.JsonObject().toJsonObject(this.textWorker.survey));
            this.setUndoRedoCurrentState(true);
            this.koIsShowDesigner(true);
        };
        SurveyEditor.prototype.showJsonEditor = function () {
            this.jsonEditor.setValue(this.getSurveyTextFromDesigner());
            this.jsonEditor.focus();
            this.koIsShowDesigner(false);
        };
        SurveyEditor.prototype.getSurveyTextFromDesigner = function () {
            var json = new Survey.JsonObject().toJsonObject(this.survey);
            if (this.options && this.options.generateValidJSON)
                return JSON.stringify(json, null, 1);
            return new SurveyEditor_1.SurveyJSON5().stringify(json, null, 1);
        };
        SurveyEditor.prototype.selectedObjectChanged = function (obj) {
            var canDeleteObject = false;
            this.selectedObjectEditor.selectedObject = obj;
            this.surveyVerbs.obj = obj;
            var objType = SurveyEditor_1.SurveyHelper.getObjectType(obj);
            if (objType == SurveyEditor_1.ObjType.Page) {
                this.survey.currentPage = obj;
                canDeleteObject = this.survey.pages.length > 1;
            }
            if (objType == SurveyEditor_1.ObjType.Question) {
                this.survey["setselectedQuestion"](obj);
                canDeleteObject = true;
                this.survey.currentPage = this.survey.getPageByQuestion(this.survey["selectedQuestionValue"]);
            }
            else {
                this.survey["setselectedQuestion"](null);
            }
            this.koCanDeleteObject(canDeleteObject);
        };
        SurveyEditor.prototype.applyBinding = function () {
            if (this.renderedElement == null)
                return;
            ko.cleanNode(this.renderedElement);
            ko.applyBindings(this, this.renderedElement);
            this.surveyjs = document.getElementById("surveyjs");
            if (this.surveyjs) {
                var self = this;
                this.surveyjs.onkeydown = function (e) {
                    if (!e)
                        return;
                    if (e.keyCode == 46)
                        self.deleteQuestion();
                    if (e.keyCode == 38 || e.keyCode == 40) {
                        self.selectQuestion(e.keyCode == 38);
                    }
                };
            }
            this.jsonEditor = ace.edit("surveyjsEditor");
            this.surveyjsExample = document.getElementById("surveyjsExample");
            this.initSurvey(new SurveyEditor_1.SurveyJSON5().parse(SurveyEditor.defaultNewSurveyText));
            this.setUndoRedoCurrentState(true);
            this.surveyValue.mode = "designer";
            this.surveyValue.render(this.surveyjs);
            this.initJsonEditor();
            SurveyEditor_1.SurveyTextWorker.newLineChar = this.jsonEditor.session.doc.getNewLineCharacter();
        };
        SurveyEditor.prototype.initJsonEditor = function () {
            var self = this;
            this.jsonEditor.setTheme("ace/theme/monokai");
            this.jsonEditor.session.setMode("ace/mode/json");
            this.jsonEditor.setShowPrintMargin(false);
            this.jsonEditor.getSession().on("change", function () {
                self.onJsonEditorChanged();
            });
            this.jsonEditor.getSession().setUseWorker(true);
        };
        SurveyEditor.prototype.initSurvey = function (json) {
            this.surveyValue = new Survey.Survey(json);
            if (this.surveyValue.isEmpty) {
                this.surveyValue = new Survey.Survey(new SurveyEditor_1.SurveyJSON5().parse(SurveyEditor.defaultNewSurveyText));
            }
            this.survey.mode = "designer";
            this.survey.render(this.surveyjs);
            this.surveyObjects.survey = this.survey;
            this.pagesEditor.survey = this.survey;
            this.pagesEditor.setSelectedPage(this.survey.currentPage);
            this.surveyVerbs.survey = this.survey;
            var self = this;
            this.surveyValue["onSelectedQuestionChanged"].add(function (sender, options) { self.surveyObjects.selectObject(sender["selectedQuestionValue"]); });
            this.surveyValue["onCopyQuestion"].add(function (sender, options) { self.copyQuestion(self.koSelectedObject().value); });
            this.surveyValue["onCreateDragDropHelper"] = function () { return self.createDragDropHelper(); };
            this.surveyValue.onProcessHtml.add(function (sender, options) { options.html = self.processHtml(options.html); });
            this.surveyValue.onCurrentPageChanged.add(function (sender, options) { self.pagesEditor.setSelectedPage(sender.currentPage); });
            this.surveyValue.onQuestionAdded.add(function (sender, options) { self.onQuestionAdded(options.question); });
            this.surveyValue.onQuestionRemoved.add(function (sender, options) { self.onQuestionRemoved(options.question); });
        };
        SurveyEditor.prototype.processHtml = function (html) {
            if (!html)
                return html;
            var scriptRegEx = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
            while (scriptRegEx.test(html)) {
                html = html.replace(scriptRegEx, "");
            }
            return html;
        };
        SurveyEditor.prototype.onJsonEditorChanged = function () {
            if (this.timeoutId > -1) {
                clearTimeout(this.timeoutId);
            }
            if (this.isProcessingImmediately) {
                this.timeoutId = -1;
            }
            else {
                var self = this;
                this.timeoutId = setTimeout(function () {
                    self.timeoutId = -1;
                    self.processJson(self.text);
                }, SurveyEditor.updateTextTimeout);
            }
        };
        SurveyEditor.prototype.processJson = function (text) {
            this.textWorker = new SurveyEditor_1.SurveyTextWorker(text);
            this.jsonEditor.getSession().setAnnotations(this.createAnnotations(text, this.textWorker.errors));
        };
        SurveyEditor.prototype.doDraggingQuestion = function (questionType, e) {
            this.createDragDropHelper().startDragNewQuestion(e, questionType, this.getNewQuestionName());
        };
        SurveyEditor.prototype.doDraggingCopiedQuestion = function (json, e) {
            this.createDragDropHelper().startDragCopiedQuestion(e, this.getNewQuestionName(), json);
        };
        SurveyEditor.prototype.createDragDropHelper = function () {
            var self = this;
            return new SurveyEditor_1.DragDropHelper(this.survey, function () { self.setModified(); });
        };
        SurveyEditor.prototype.doClickQuestion = function (questionType) {
            this.doClickQuestionCore(Survey.QuestionFactory.Instance.createQuestion(questionType, this.getNewQuestionName()));
        };
        SurveyEditor.prototype.doClickCopiedQuestion = function (json) {
            var name = this.getNewQuestionName();
            var question = Survey.QuestionFactory.Instance.createQuestion(json["type"], name);
            new Survey.JsonObject().toObject(json, question);
            question.name = name;
            this.doClickQuestionCore(question);
        };
        SurveyEditor.prototype.getNewQuestionName = function () {
            return SurveyEditor_1.SurveyHelper.getNewQuestionName(this.survey.getAllQuestions());
        };
        SurveyEditor.prototype.doClickQuestionCore = function (question) {
            var page = this.survey.currentPage;
            var index = -1;
            if (this.survey["selectedQuestionValue"] != null) {
                index = page.questions.indexOf(this.survey["selectedQuestionValue"]) + 1;
            }
            page.addQuestion(question, index);
            this.setModified();
        };
        SurveyEditor.prototype.deleteQuestion = function () {
            var question = this.getSelectedObjAsQuestion();
            if (question) {
                this.deleteCurrentObject();
            }
        };
        SurveyEditor.prototype.selectQuestion = function (isUp) {
            var question = this.getSelectedObjAsQuestion();
            if (question) {
                this.surveyObjects.selectNextQuestion(isUp);
            }
        };
        SurveyEditor.prototype.getSelectedObjAsQuestion = function () {
            var obj = this.koSelectedObject().value;
            if (!obj)
                return null;
            return SurveyEditor_1.SurveyHelper.getObjectType(obj) == SurveyEditor_1.ObjType.Question ? (obj) : null;
        };
        SurveyEditor.prototype.deleteCurrentObject = function () {
            this.deleteObject(this.koSelectedObject().value);
        };
        SurveyEditor.prototype.copyQuestion = function (question) {
            var objType = SurveyEditor_1.SurveyHelper.getObjectType(question);
            if (objType != SurveyEditor_1.ObjType.Question)
                return;
            var json = new Survey.JsonObject().toJsonObject(question);
            json.type = question.getType();
            var item = this.getCopiedQuestionByName(question.name);
            if (item) {
                item.json = json;
            }
            else {
                this.koCopiedQuestions.push({ name: question.name, json: json });
            }
            if (this.koCopiedQuestions().length > 3) {
                this.koCopiedQuestions.splice(0, 1);
            }
        };
        SurveyEditor.prototype.getCopiedQuestionByName = function (name) {
            var items = this.koCopiedQuestions();
            for (var i = 0; i < items.length; i++) {
                if (items[i].name == name)
                    return items[i];
            }
            return null;
        };
        SurveyEditor.prototype.deleteObject = function (obj) {
            this.surveyObjects.removeObject(obj);
            var objType = SurveyEditor_1.SurveyHelper.getObjectType(obj);
            if (objType == SurveyEditor_1.ObjType.Page) {
                this.survey.removePage(obj);
                this.pagesEditor.removePage(obj);
                this.setModified();
            }
            if (objType == SurveyEditor_1.ObjType.Question) {
                this.survey.currentPage.removeQuestion(obj);
                this.survey["setselectedQuestion"](null);
                this.surveyObjects.selectObject(this.survey.currentPage);
                this.setModified();
            }
            this.survey.render();
        };
        SurveyEditor.prototype.showLiveSurvey = function () {
            var _this = this;
            if (!this.surveyjsExample)
                return;
            var json = this.getSurveyJSON();
            if (json != null) {
                if (json.cookieName) {
                    delete json.cookieName;
                }
                var survey = new Survey.Survey(json);
                var self = this;
                var surveyjsExampleResults = document.getElementById("surveyjsExampleResults");
                if (surveyjsExampleResults)
                    surveyjsExampleResults.innerHTML = "";
                survey.onComplete.add(function (sender) { if (surveyjsExampleResults)
                    surveyjsExampleResults.innerHTML = _this.getLocString("ed.surveyResults") + JSON.stringify(survey.data); });
                survey.render(this.surveyjsExample);
            }
            else {
                this.surveyjsExample.innerHTML = this.getLocString("ed.correctJSON");
            }
        };
        SurveyEditor.prototype.showSurveyEmbeding = function () {
            var json = this.getSurveyJSON();
            this.surveyEmbeding.json = json;
            this.surveyEmbeding.surveyId = this.surveyId;
            this.surveyEmbeding.surveyPostId = this.surveyPostId;
            this.surveyEmbeding.generateValidJSON = this.options && this.options.generateValidJSON;
            this.surveyEmbeding.show();
        };
        SurveyEditor.prototype.getSurveyJSON = function () {
            if (this.koIsShowDesigner())
                return new Survey.JsonObject().toJsonObject(this.survey);
            if (this.textWorker.isJsonCorrect)
                return new Survey.JsonObject().toJsonObject(this.textWorker.survey);
            return null;
        };
        SurveyEditor.prototype.createAnnotations = function (text, errors) {
            var annotations = new Array();
            for (var i = 0; i < errors.length; i++) {
                var error = errors[i];
                var annotation = { row: error.position.start.row, column: error.position.start.column, text: error.text, type: "error" };
                annotations.push(annotation);
            }
            return annotations;
        };
        SurveyEditor.updateTextTimeout = 1000;
        SurveyEditor.defaultNewSurveyText = "{ pages: [ { name: 'page1'}] }";
        return SurveyEditor;
    }());
    SurveyEditor_1.SurveyEditor = SurveyEditor;
    new Survey.SurveyTemplateText().replaceText(template_page.html, "page");
    new Survey.SurveyTemplateText().replaceText(template_question.html, "question");
    Survey.Survey.prototype["onCreating"] = function () {
        this.selectedQuestionValue = null;
        this.onSelectedQuestionChanged = new Survey.Event();
        this.onCopyQuestion = new Survey.Event();
        this.onCreateDragDropHelper = null;
        var self = this;
        this.copyQuestionClick = function () { self.onCopyQuestion.fire(self); };
    };
    Survey.Survey.prototype["setselectedQuestion"] = function (value) {
        if (value == this.selectedQuestionValue)
            return;
        var oldValue = this.selectedQuestionValue;
        this.selectedQuestionValue = value;
        if (oldValue != null) {
            oldValue["onSelectedQuestionChanged"]();
        }
        if (this.selectedQuestionValue != null) {
            this.selectedQuestionValue["onSelectedQuestionChanged"]();
        }
        this.onSelectedQuestionChanged.fire(this, { 'oldSelectedQuestion': oldValue, 'newSelectedQuestion': value });
    };
    Survey.Survey.prototype["getEditorLocString"] = function (value) {
        return SurveyEditor_1.editorLocalization.getString(value);
    };
    Survey.Page.prototype["onCreating"] = function () {
        var self = this;
        this.dragEnterCounter = 0;
        this.koDragging = ko.observable(-1);
        this.koDragging.subscribe(function (newValue) { if (newValue < 0)
            self.dragEnterCounter = 0; });
        this.dragEnter = function (e) { e.preventDefault(); self.dragEnterCounter++; self.doDragEnter(e); };
        this.dragLeave = function (e) { self.dragEnterCounter--; if (self.dragEnterCounter === 0)
            self.koDragging(-1); };
        this.dragDrop = function (e) { self.doDrop(e); };
    };
    Survey.Page.prototype["doDrop"] = function (e) {
        var dragDropHelper = this.data["onCreateDragDropHelper"] ? this.data["onCreateDragDropHelper"]() : new SurveyEditor_1.DragDropHelper(this.data, null);
        dragDropHelper.doDrop(e);
    };
    Survey.Page.prototype["doDragEnter"] = function (e) {
        if (this.questions.length > 0 || this.koDragging() > 0)
            return;
        if (new SurveyEditor_1.DragDropHelper(this.data, null).isSurveyDragging(e)) {
            this.koDragging(this.questions.length);
        }
    };
    Survey.QuestionBase.prototype["onCreating"] = function () {
        var self = this;
        this.dragDropHelperValue = null;
        this.dragDropHelper = function () {
            if (self.dragDropHelperValue == null) {
                self.dragDropHelperValue = self.data["onCreateDragDropHelper"] ? self.data["onCreateDragDropHelper"]() : new SurveyEditor_1.DragDropHelper(self.data, null);
                ;
            }
            return self.dragDropHelperValue;
        };
        this.dragOver = function (e) { self.dragDropHelper().doDragDropOver(e, self); };
        this.dragDrop = function (e) { self.dragDropHelper().doDrop(e, self); };
        this.dragStart = function (e) { self.dragDropHelper().startDragQuestion(e, self.name); };
        this.koIsSelected = ko.observable(false);
        this.koOnClick = function () {
            if (self.data == null)
                return;
            self.data["setselectedQuestion"](this);
        };
    };
    Survey.QuestionBase.prototype["onSelectedQuestionChanged"] = function () {
        if (this.data == null)
            return;
        this.koIsSelected(this.data["selectedQuestionValue"] == this);
    };
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    SurveyEditor.editorLocalization = {
        currentLocale: "",
        locales: {},
        getString: function (strName, locale) {
            if (locale === void 0) { locale = null; }
            if (!locale)
                locale = this.currentLocale;
            var loc = locale ? this.locales[this.currentLocale] : SurveyEditor.defaultStrings;
            if (!loc)
                loc = SurveyEditor.defaultStrings;
            var path = strName.split('.');
            var obj = loc;
            for (var i = 0; i < path.length; i++) {
                obj = obj[path[i]];
                if (!obj) {
                    if (loc === SurveyEditor.defaultStrings)
                        return path[i];
                    return this.getString(strName, "en");
                }
            }
            return obj;
        },
        getPropertyName: function (strName, local) {
            if (local === void 0) { local = null; }
            var obj = this.getProperty(strName, local);
            if (obj["name"])
                return obj["name"];
            return obj;
        },
        getPropertyTitle: function (strName, local) {
            if (local === void 0) { local = null; }
            var obj = this.getProperty(strName, local);
            if (obj["title"])
                return obj["title"];
            return "";
        },
        getProperty: function (strName, local) {
            if (local === void 0) { local = null; }
            var obj = this.getString("p." + strName, local);
            if (obj !== strName)
                return obj;
            var pos = strName.indexOf('_');
            if (pos < -1)
                return obj;
            strName = strName.substr(pos + 1);
            return this.getString("p." + strName, local);
        },
        getLocales: function () {
            var res = [];
            res.push("");
            for (var key in this.locales) {
                res.push(key);
            }
            return res;
        }
    };
    SurveyEditor.defaultStrings = {
        //survey templates
        survey: {
            dropQuestion: "Please drop a question here.",
            copy: "Copy"
        },
        //questionTypes
        qt: {
            checkbox: "Checkbox",
            comment: "Comment",
            dropdown: "Dropdown",
            file: "File",
            html: "Html",
            matrix: "Matrix (single choice)",
            matrixdropdown: "Matrix (multiple choice)",
            matrixdynamic: "Matrix (dynamic rows)",
            multipletext: "Multiple Text",
            radiogroup: "Radiogroup",
            rating: "Rating",
            text: "Text"
        },
        //Strings in Editor
        ed: {
            newPageName: "page",
            newQuestionName: "question",
            runSurvey: " Run Survey",
            embedSurvey: "Embed Survey",
            saveSurvey: "Save Survey",
            designer: "Designer",
            jsonEditor: "JSON Editor",
            undo: "Undo",
            redo: "Redo",
            options: "Options",
            generateValidJSON: "Generate Valid JSON",
            generateReadableJSON: "Generate Readable JSON",
            toolbox: "Toolbox",
            delSelObject: "Delete selected object",
            correctJSON: "Please correct JSON.",
            surveyResults: "Survey Result: "
        },
        //Property Editors
        pe: {
            apply: "Apply",
            close: "Close",
            delete: "Delete",
            addNew: "Add New",
            removeAll: "Remove All",
            edit: "Edit",
            value: "Value",
            text: "Text",
            required: "Required?",
            hasOther: "Has Other Item",
            name: "Name",
            title: "Title",
            cellType: "Cell Type",
            colCount: "Column Count",
            editProperty: "Edit property '{0}'",
            items: "[ Items: {0} ]",
            enterNewValue: "Please, enter the value.",
            noquestions: "There is no any question in the survey.",
            createtrigger: "Please create a trigger",
            triggerOn: "On ",
            triggerMakePagesVisible: "Make pages visible:",
            triggerMakeQuestionsVisible: "Make questions visible:",
            triggerCompleteText: "Complete the survey if succeed.",
            triggerNotSet: "The trigger is not set",
            triggerRunIf: "Run if",
            triggerSetToName: "Change value of: ",
            triggerSetValue: "to: ",
            triggerIsVariable: "Do not put the variable into the survey result.",
            verbChangeType: "Change type ",
            verbChangePage: "Change page "
        },
        //Operators
        op: {
            empty: "is empty",
            notempty: "is not empty",
            equal: "equals",
            notequal: "not equals",
            contains: "contains",
            notcontains: "not contains",
            greater: "greater",
            less: "less",
            greaterorequal: "greater or equals",
            lessorequal: "Less or Equals"
        },
        //Embed window
        ew: {
            knockout: "Use Knockout version",
            react: "Use React version",
            bootstrap: "For bootstrap framework",
            standard: "No bootstrap",
            showOnPage: "Show survey on a page",
            showInWindow: "Show survey in a window",
            loadFromServer: "Load Survey JSON from server",
            titleScript: "Scripts and styles",
            titleHtml: "HTML",
            titleJavaScript: "JavaScript"
        },
        //Properties
        p: {
            name: "name",
            title: { name: "title", title: "Leave it empty, if it is the same as 'Name'" },
            survey_title: { name: "title", title: "It will be shown on every page." },
            page_title: { name: "title", title: "Page title" }
        }
    };
    SurveyEditor.editorLocalization.locales["en"] = SurveyEditor.defaultStrings;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
// This file is based on JSON5, http://json5.org/
// The modification for getting object and properties location 'at' were maden.
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyJSON5 = (function () {
        function SurveyJSON5(parseType) {
            if (parseType === void 0) { parseType = 0; }
            this.parseType = parseType;
        }
        SurveyJSON5.prototype.parse = function (source, reviver, startFrom, endAt) {
            if (reviver === void 0) { reviver = null; }
            if (startFrom === void 0) { startFrom = 0; }
            if (endAt === void 0) { endAt = -1; }
            var result;
            this.text = String(source);
            this.at = startFrom;
            this.endAt = endAt;
            this.ch = ' ';
            result = this.value();
            this.white();
            if (this.ch) {
                this.error("Syntax error");
            }
            // If there is a reviver function, we recursively walk the new structure,
            // passing each name/value pair to the reviver function for possible
            // transformation, starting with a temporary root object that holds the result
            // in an empty key. If there is not a reviver function, we simply return the
            // result.
            return typeof reviver === 'function' ? (function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            }
                            else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }({ '': result }, '')) : result;
        };
        SurveyJSON5.prototype.error = function (m) {
            // Call error when something is wrong.
            var error = new SyntaxError();
            error.message = m;
            error["at"] = this.at;
            throw error;
        };
        SurveyJSON5.prototype.next = function (c) {
            if (c === void 0) { c = null; }
            // If a c parameter is provided, verify that it matches the current character.
            if (c && c !== this.ch) {
                this.error("Expected '" + c + "' instead of '" + this.ch + "'");
            }
            // Get the this.next character. When there are no more characters,
            // return the empty string.
            this.ch = this.chartAt();
            this.at += 1;
            return this.ch;
        };
        SurveyJSON5.prototype.peek = function () {
            // Get the this.next character without consuming it or
            // assigning it to the this.ch varaible.
            return this.chartAt();
        };
        SurveyJSON5.prototype.chartAt = function () {
            if (this.endAt > -1 && this.at >= this.endAt)
                return '';
            return this.text.charAt(this.at);
        };
        SurveyJSON5.prototype.identifier = function () {
            // Parse an identifier. Normally, reserved words are disallowed here, but we
            // only use this for unquoted object keys, where reserved words are allowed,
            // so we don't check for those here. References:
            // - http://es5.github.com/#x7.6
            // - https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Core_Language_Features#Variables
            // - http://docstore.mik.ua/orelly/webprog/jscript/ch02_07.htm
            // TODO Identifiers can have Unicode "letters" in them; add support for those.
            var key = this.ch;
            // Identifiers must start with a letter, _ or $.
            if ((this.ch !== '_' && this.ch !== '$') &&
                (this.ch < 'a' || this.ch > 'z') &&
                (this.ch < 'A' || this.ch > 'Z')) {
                this.error("Bad identifier");
            }
            // Subsequent characters can contain digits.
            while (this.next() && (this.ch === '_' || this.ch === '$' ||
                (this.ch >= 'a' && this.ch <= 'z') ||
                (this.ch >= 'A' && this.ch <= 'Z') ||
                (this.ch >= '0' && this.ch <= '9'))) {
                key += this.ch;
            }
            return key;
        };
        SurveyJSON5.prototype.number = function () {
            // Parse a number value.
            var number, sign = '', string = '', base = 10;
            if (this.ch === '-' || this.ch === '+') {
                sign = this.ch;
                this.next(this.ch);
            }
            // support for Infinity (could tweak to allow other words):
            if (this.ch === 'I') {
                number = this.word();
                if (typeof number !== 'number' || isNaN(number)) {
                    this.error('Unexpected word for number');
                }
                return (sign === '-') ? -number : number;
            }
            // support for NaN
            if (this.ch === 'N') {
                number = this.word();
                if (!isNaN(number)) {
                    this.error('expected word to be NaN');
                }
                // ignore sign as -NaN also is NaN
                return number;
            }
            if (this.ch === '0') {
                string += this.ch;
                this.next();
                if (this.ch === 'x' || this.ch === 'X') {
                    string += this.ch;
                    this.next();
                    base = 16;
                }
                else if (this.ch >= '0' && this.ch <= '9') {
                    this.error('Octal literal');
                }
            }
            switch (base) {
                case 10:
                    while (this.ch >= '0' && this.ch <= '9') {
                        string += this.ch;
                        this.next();
                    }
                    if (this.ch === '.') {
                        string += '.';
                        while (this.next() && this.ch >= '0' && this.ch <= '9') {
                            string += this.ch;
                        }
                    }
                    if (this.ch === 'e' || this.ch === 'E') {
                        string += this.ch;
                        this.next();
                        if (this.ch === '-' || this.ch === '+') {
                            string += this.ch;
                            this.next();
                        }
                        while (this.ch >= '0' && this.ch <= '9') {
                            string += this.ch;
                            this.next();
                        }
                    }
                    break;
                case 16:
                    while (this.ch >= '0' && this.ch <= '9' || this.ch >= 'A' && this.ch <= 'F' || this.ch >= 'a' && this.ch <= 'f') {
                        string += this.ch;
                        this.next();
                    }
                    break;
            }
            if (sign === '-') {
                number = -string;
            }
            else {
                number = +string;
            }
            if (!isFinite(number)) {
                this.error("Bad number");
            }
            else {
                return number;
            }
        };
        SurveyJSON5.prototype.string = function () {
            // Parse a string value.
            var hex, i, string = '', delim, // double quote or single quote
            uffff;
            // When parsing for string values, we must look for ' or " and \ characters.
            if (this.ch === '"' || this.ch === "'") {
                delim = this.ch;
                while (this.next()) {
                    if (this.ch === delim) {
                        this.next();
                        return string;
                    }
                    else if (this.ch === '\\') {
                        this.next();
                        if (this.ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(this.next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        }
                        else if (this.ch === '\r') {
                            if (this.peek() === '\n') {
                                this.next();
                            }
                        }
                        else if (typeof SurveyJSON5.escapee[this.ch] === 'string') {
                            string += SurveyJSON5.escapee[this.ch];
                        }
                        else {
                            break;
                        }
                    }
                    else if (this.ch === '\n') {
                        // unescaped newlines are invalid; see:
                        // https://github.com/aseemk/json5/issues/24
                        // TODO this feels special-cased; are there other
                        // invalid unescaped chars?
                        break;
                    }
                    else {
                        string += this.ch;
                    }
                }
            }
            this.error("Bad string");
        };
        SurveyJSON5.prototype.inlineComment = function () {
            // Skip an inline comment, assuming this is one. The current character should
            // be the second / character in the // pair that begins this inline comment.
            // To finish the inline comment, we look for a newline or the end of the text.
            if (this.ch !== '/') {
                this.error("Not an inline comment");
            }
            do {
                this.next();
                if (this.ch === '\n' || this.ch === '\r') {
                    this.next();
                    return;
                }
            } while (this.ch);
        };
        SurveyJSON5.prototype.blockComment = function () {
            // Skip a block comment, assuming this is one. The current character should be
            // the * character in the /* pair that begins this block comment.
            // To finish the block comment, we look for an ending */ pair of characters,
            // but we also watch for the end of text before the comment is terminated.
            if (this.ch !== '*') {
                this.error("Not a block comment");
            }
            do {
                this.next();
                while (this.ch === '*') {
                    this.next('*');
                    if (this.ch === '/') {
                        this.next('/');
                        return;
                    }
                }
            } while (this.ch);
            this.error("Unterminated block comment");
        };
        SurveyJSON5.prototype.comment = function () {
            // Skip a comment, whether inline or block-level, assuming this is one.
            // Comments always begin with a / character.
            if (this.ch !== '/') {
                this.error("Not a comment");
            }
            this.next('/');
            if (this.ch === '/') {
                this.inlineComment();
            }
            else if (this.ch === '*') {
                this.blockComment();
            }
            else {
                this.error("Unrecognized comment");
            }
        };
        SurveyJSON5.prototype.white = function () {
            // Skip whitespace and comments.
            // Note that we're detecting comments by only a single / character.
            // This works since regular expressions are not valid JSON(5), but this will
            // break if there are other valid values that begin with a / character!
            while (this.ch) {
                if (this.ch === '/') {
                    this.comment();
                }
                else if (SurveyJSON5.ws.indexOf(this.ch) >= 0) {
                    this.next();
                }
                else {
                    return;
                }
            }
        };
        SurveyJSON5.prototype.word = function () {
            // true, false, or null.
            switch (this.ch) {
                case 't':
                    this.next('t');
                    this.next('r');
                    this.next('u');
                    this.next('e');
                    return true;
                case 'f':
                    this.next('f');
                    this.next('a');
                    this.next('l');
                    this.next('s');
                    this.next('e');
                    return false;
                case 'n':
                    this.next('n');
                    this.next('u');
                    this.next('l');
                    this.next('l');
                    return null;
                case 'I':
                    this.next('I');
                    this.next('n');
                    this.next('f');
                    this.next('i');
                    this.next('n');
                    this.next('i');
                    this.next('t');
                    this.next('y');
                    return Infinity;
                case 'N':
                    this.next('N');
                    this.next('a');
                    this.next('N');
                    return NaN;
            }
            this.error("Unexpected '" + this.ch + "'");
        };
        SurveyJSON5.prototype.array = function () {
            // Parse an array value.
            var array = [];
            if (this.ch === '[') {
                this.next('[');
                this.white();
                while (this.ch) {
                    if (this.ch === ']') {
                        this.next(']');
                        return array; // Potentially empty array
                    }
                    // ES5 allows omitting elements in arrays, e.g. [,] and
                    // [,null]. We don't allow this in JSON5.
                    if (this.ch === ',') {
                        this.error("Missing array element");
                    }
                    else {
                        array.push(this.value());
                    }
                    this.white();
                    // If there's no comma after this value, this needs to
                    // be the end of the array.
                    if (this.ch !== ',') {
                        this.next(']');
                        return array;
                    }
                    this.next(',');
                    this.white();
                }
            }
            this.error("Bad array");
        };
        SurveyJSON5.prototype.object = function () {
            // Parse an object value.
            var key, start, isFirstProperty = true, object = {};
            if (this.parseType > 0) {
                object[SurveyJSON5.positionName] = { start: this.at - 1 };
            }
            if (this.ch === '{') {
                this.next('{');
                this.white();
                start = this.at - 1;
                while (this.ch) {
                    if (this.ch === '}') {
                        if (this.parseType > 0) {
                            object[SurveyJSON5.positionName].end = start;
                        }
                        this.next('}');
                        return object; // Potentially empty object
                    }
                    // Keys can be unquoted. If they are, they need to be
                    // valid JS identifiers.
                    if (this.ch === '"' || this.ch === "'") {
                        key = this.string();
                    }
                    else {
                        key = this.identifier();
                    }
                    this.white();
                    if (this.parseType > 1) {
                        object[SurveyJSON5.positionName][key] = { start: start, valueStart: this.at };
                    }
                    this.next(':');
                    object[key] = this.value();
                    if (this.parseType > 1) {
                        start = this.at - 1;
                        object[SurveyJSON5.positionName][key].valueEnd = start;
                        object[SurveyJSON5.positionName][key].end = start;
                    }
                    this.white();
                    // If there's no comma after this pair, this needs to be
                    // the end of the object.
                    if (this.ch !== ',') {
                        if (this.parseType > 1) {
                            object[SurveyJSON5.positionName][key].valueEnd--;
                            object[SurveyJSON5.positionName][key].end--;
                        }
                        if (this.parseType > 0) {
                            object[SurveyJSON5.positionName].end = this.at - 1;
                        }
                        this.next('}');
                        return object;
                    }
                    if (this.parseType > 1) {
                        object[SurveyJSON5.positionName][key].valueEnd--;
                        if (!isFirstProperty) {
                            object[SurveyJSON5.positionName][key].end--;
                        }
                    }
                    this.next(',');
                    this.white();
                    isFirstProperty = false;
                }
            }
            this.error("Bad object");
        };
        SurveyJSON5.prototype.value = function () {
            // Parse a JSON value. It could be an object, an array, a string, a number,
            // or a word.
            this.white();
            switch (this.ch) {
                case '{':
                    return this.object();
                case '[':
                    return this.array();
                case '"':
                case "'":
                    return this.string();
                case '-':
                case '+':
                case '.':
                    return this.number();
                default:
                    return this.ch >= '0' && this.ch <= '9' ? this.number() : this.word();
            }
        };
        SurveyJSON5.prototype.stringify = function (obj, replacer, space) {
            if (replacer === void 0) { replacer = null; }
            if (space === void 0) { space = null; }
            if (replacer && (typeof (replacer) !== "function" && !this.isArray(replacer))) {
                throw new Error('Replacer must be a function or an array');
            }
            this.replacer = replacer;
            this.indentStr = this.getIndent(space);
            this.objStack = [];
            // special case...when undefined is used inside of
            // a compound object/array, return null.
            // but when top-level, return undefined
            var topLevelHolder = { "": obj };
            if (obj === undefined) {
                return this.getReplacedValueOrUndefined(topLevelHolder, '', true);
            }
            return this.internalStringify(topLevelHolder, '', true);
        };
        SurveyJSON5.prototype.getIndent = function (space) {
            if (space) {
                if (typeof space === "string") {
                    return space;
                }
                else if (typeof space === "number" && space >= 0) {
                    return this.makeIndent(" ", space, true);
                }
            }
            return "";
        };
        SurveyJSON5.prototype.getReplacedValueOrUndefined = function (holder, key, isTopLevel) {
            var value = holder[key];
            // Replace the value with its toJSON value first, if possible
            if (value && value.toJSON && typeof value.toJSON === "function") {
                value = value.toJSON();
            }
            // If the user-supplied replacer if a function, call it. If it's an array, check objects' string keys for
            // presence in the array (removing the key/value pair from the resulting JSON if the key is missing).
            if (typeof (this.replacer) === "function") {
                return this.replacer.call(holder, key, value);
            }
            else if (this.replacer) {
                if (isTopLevel || this.isArray(holder) || this.replacer.indexOf(key) >= 0) {
                    return value;
                }
                else {
                    return undefined;
                }
            }
            else {
                return value;
            }
        };
        SurveyJSON5.prototype.isWordChar = function (char) {
            return (char >= 'a' && char <= 'z') ||
                (char >= 'A' && char <= 'Z') ||
                (char >= '0' && char <= '9') ||
                char === '_' || char === '$';
        };
        SurveyJSON5.prototype.isWordStart = function (char) {
            return (char >= 'a' && char <= 'z') ||
                (char >= 'A' && char <= 'Z') ||
                char === '_' || char === '$';
        };
        SurveyJSON5.prototype.isWord = function (key) {
            if (typeof key !== 'string') {
                return false;
            }
            if (!this.isWordStart(key[0])) {
                return false;
            }
            var i = 1, length = key.length;
            while (i < length) {
                if (!this.isWordChar(key[i])) {
                    return false;
                }
                i++;
            }
            return true;
        };
        // polyfills
        SurveyJSON5.prototype.isArray = function (obj) {
            if (Array.isArray) {
                return Array.isArray(obj);
            }
            else {
                return Object.prototype.toString.call(obj) === '[object Array]';
            }
        };
        SurveyJSON5.prototype.isDate = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Date]';
        };
        SurveyJSON5.prototype.isNaN = function (val) {
            return typeof val === 'number' && val !== val;
        };
        SurveyJSON5.prototype.checkForCircular = function (obj) {
            for (var i = 0; i < this.objStack.length; i++) {
                if (this.objStack[i] === obj) {
                    throw new TypeError("Converting circular structure to JSON");
                }
            }
        };
        SurveyJSON5.prototype.makeIndent = function (str, num, noNewLine) {
            if (noNewLine === void 0) { noNewLine = false; }
            if (!str) {
                return "";
            }
            // indentation no more than 10 chars
            if (str.length > 10) {
                str = str.substring(0, 10);
            }
            var indent = noNewLine ? "" : "\n";
            for (var i = 0; i < num; i++) {
                indent += str;
            }
            return indent;
        };
        SurveyJSON5.prototype.escapeString = function (str) {
            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.
            SurveyJSON5.escapable.lastIndex = 0;
            return SurveyJSON5.escapable.test(str) ? '"' + str.replace(SurveyJSON5.escapable, function (a) {
                var c = SurveyJSON5.meta[a];
                return typeof c === 'string' ?
                    c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' : '"' + str + '"';
        };
        // End
        SurveyJSON5.prototype.internalStringify = function (holder, key, isTopLevel) {
            var buffer, res;
            // Replace the value, if necessary
            var obj_part = this.getReplacedValueOrUndefined(holder, key, isTopLevel);
            if (obj_part && !this.isDate(obj_part)) {
                // unbox objects
                // don't unbox dates, since will turn it into number
                obj_part = obj_part.valueOf();
            }
            switch (typeof obj_part) {
                case "boolean":
                    return obj_part.toString();
                case "number":
                    if (isNaN(obj_part) || !isFinite(obj_part)) {
                        return "null";
                    }
                    return obj_part.toString();
                case "string":
                    return this.escapeString(obj_part.toString());
                case "object":
                    if (obj_part === null) {
                        return "null";
                    }
                    else if (this.isArray(obj_part)) {
                        this.checkForCircular(obj_part);
                        buffer = "[";
                        this.objStack.push(obj_part);
                        for (var i = 0; i < obj_part.length; i++) {
                            res = this.internalStringify(obj_part, i, false);
                            buffer += this.makeIndent(this.indentStr, this.objStack.length);
                            if (res === null || typeof res === "undefined") {
                                buffer += "null";
                            }
                            else {
                                buffer += res;
                            }
                            if (i < obj_part.length - 1) {
                                buffer += ",";
                            }
                            else if (this.indentStr) {
                                buffer += "\n";
                            }
                        }
                        this.objStack.pop();
                        buffer += this.makeIndent(this.indentStr, this.objStack.length, true) + "]";
                    }
                    else {
                        this.checkForCircular(obj_part);
                        buffer = "{";
                        var nonEmpty = false;
                        this.objStack.push(obj_part);
                        for (var prop in obj_part) {
                            if (obj_part.hasOwnProperty(prop)) {
                                var value = this.internalStringify(obj_part, prop, false);
                                isTopLevel = false;
                                if (typeof value !== "undefined" && value !== null) {
                                    buffer += this.makeIndent(this.indentStr, this.objStack.length);
                                    nonEmpty = true;
                                    var propKey = this.isWord(prop) ? prop : this.escapeString(prop);
                                    buffer += propKey + ":" + (this.indentStr ? ' ' : '') + value + ",";
                                }
                            }
                        }
                        this.objStack.pop();
                        if (nonEmpty) {
                            buffer = buffer.substring(0, buffer.length - 1) + this.makeIndent(this.indentStr, this.objStack.length) + "}";
                        }
                        else {
                            buffer = '{}';
                        }
                    }
                    return buffer;
                default:
                    // functions and undefined should be ignored
                    return undefined;
            }
        };
        SurveyJSON5.positionName = "pos";
        SurveyJSON5.escapee = {
            "'": "'",
            '"': '"',
            '\\': '\\',
            '/': '/',
            '\n': '',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t'
        };
        SurveyJSON5.ws = [
            ' ',
            '\t',
            '\r',
            '\n',
            '\v',
            '\f',
            '\xA0',
            '\uFEFF'
        ];
        // Copied from Crokford's implementation of JSON
        // See https://github.com/douglascrockford/JSON-js/blob/e39db4b7e6249f04a195e7dd0840e610cc9e941e/json2.js#L195
        // Begin
        SurveyJSON5.cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        SurveyJSON5.escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        SurveyJSON5.meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };
        return SurveyJSON5;
    }());
    SurveyEditor.SurveyJSON5 = SurveyJSON5;
})(SurveyEditor || (SurveyEditor = {}));

/*!
* surveyjs Editor v0.9.10
* (c) Andrew Telnov - http://surveyjs.org/builder/
* Github - https://github.com/andrewtelnov/survey.js.editor
*/
var SurveyEditor;
(function (SurveyEditor) {
    var SurveyObjectItem = (function () {
        function SurveyObjectItem() {
        }
        return SurveyObjectItem;
    }());
    SurveyEditor.SurveyObjectItem = SurveyObjectItem;
    var SurveyObjects = (function () {
        function SurveyObjects(koObjects, koSelected) {
            this.koObjects = koObjects;
            this.koSelected = koSelected;
        }
        Object.defineProperty(SurveyObjects.prototype, "survey", {
            get: function () { return this.surveyValue; },
            set: function (value) {
                if (this.survey == value)
                    return;
                this.surveyValue = value;
                this.rebuild();
            },
            enumerable: true,
            configurable: true
        });
        SurveyObjects.prototype.addPage = function (page) {
            var pageItem = this.createPage(page);
            var index = this.survey.pages.indexOf(page);
            if (index > 0) {
                var prevPage = this.survey.pages[index - 1];
                index = this.getItemIndex(prevPage) + 1;
                index += prevPage.questions.length;
            }
            else {
                index = 1; //0 - Survey
            }
            this.addItem(pageItem, index);
            index++;
            for (var i = 0; i < page.questions.length; i++) {
                var item = this.createQuestion(page.questions[i]);
                this.addItem(item, index + i);
            }
            this.koSelected(pageItem);
        };
        SurveyObjects.prototype.addQuestion = function (page, question) {
            var index = this.getItemIndex(page);
            if (index < 0)
                return;
            var questionIndex = page.questions.indexOf(question) + 1;
            index += questionIndex;
            var item = this.createQuestion(question);
            this.addItem(item, index);
            this.koSelected(item);
        };
        SurveyObjects.prototype.selectObject = function (obj) {
            var objs = this.koObjects();
            for (var i = 0; i < objs.length; i++) {
                if (objs[i].value == obj) {
                    this.koSelected(objs[i]);
                    return;
                }
            }
        };
        SurveyObjects.prototype.removeObject = function (obj) {
            var index = this.getItemIndex(obj);
            if (index < 0)
                return;
            var countToRemove = 1;
            if (SurveyEditor.SurveyHelper.getObjectType(obj) == SurveyEditor.ObjType.Page) {
                var page = obj;
                countToRemove += page.questions.length;
            }
            this.koObjects.splice(index, countToRemove);
        };
        SurveyObjects.prototype.nameChanged = function (obj) {
            var index = this.getItemIndex(obj);
            if (index < 0)
                return;
            this.koObjects()[index].text(this.getText(obj));
        };
        SurveyObjects.prototype.selectNextQuestion = function (isUp) {
            var question = this.getSelectedQuestion();
            var itemIndex = this.getItemIndex(question);
            if (itemIndex < 0)
                return question;
            var objs = this.koObjects();
            var newItemIndex = itemIndex + (isUp ? -1 : 1);
            if (newItemIndex < objs.length && SurveyEditor.SurveyHelper.getObjectType(objs[newItemIndex].value) == SurveyEditor.ObjType.Question) {
                itemIndex = newItemIndex;
            }
            else {
                newItemIndex = itemIndex;
                while (newItemIndex < objs.length && SurveyEditor.SurveyHelper.getObjectType(objs[newItemIndex].value) == SurveyEditor.ObjType.Question) {
                    itemIndex = newItemIndex;
                    newItemIndex += (isUp ? 1 : -1);
                }
            }
            this.koSelected(objs[itemIndex]);
        };
        SurveyObjects.prototype.getSelectedQuestion = function () {
            if (!this.koSelected())
                return null;
            var obj = this.koSelected().value;
            if (!obj)
                return null;
            return SurveyEditor.SurveyHelper.getObjectType(obj) == SurveyEditor.ObjType.Question ? (obj) : null;
        };
        SurveyObjects.prototype.addItem = function (item, index) {
            if (index > this.koObjects().length) {
                this.koObjects.push(item);
            }
            else {
                this.koObjects.splice(index, 0, item);
            }
        };
        SurveyObjects.prototype.rebuild = function () {
            var objs = [];
            if (this.survey == null) {
                this.koObjects(objs);
                this.koSelected(null);
                return;
            }
            objs.push(this.createItem(this.survey, "Survey"));
            for (var i = 0; i < this.survey.pages.length; i++) {
                var page = this.survey.pages[i];
                objs.push(this.createPage(page));
                for (var j = 0; j < page.questions.length; j++) {
                    objs.push(this.createQuestion(page.questions[j]));
                }
            }
            this.koObjects(objs);
            this.koSelected(this.survey);
        };
        SurveyObjects.prototype.createPage = function (page) {
            return this.createItem(page, this.getText(page));
        };
        SurveyObjects.prototype.createQuestion = function (question) {
            return this.createItem(question, this.getText(question));
        };
        SurveyObjects.prototype.createItem = function (value, text) {
            var item = new SurveyObjectItem();
            item.value = value;
            item.text = ko.observable(text);
            return item;
        };
        SurveyObjects.prototype.getItemIndex = function (value) {
            var objs = this.koObjects();
            for (var i = 0; i < objs.length; i++) {
                if (objs[i].value == value)
                    return i;
            }
            return -1;
        };
        SurveyObjects.prototype.getText = function (obj) {
            var intend = SurveyObjects.intend;
            if (SurveyEditor.SurveyHelper.getObjectType(obj) != SurveyEditor.ObjType.Page) {
                intend += SurveyObjects.intend;
            }
            return intend + SurveyEditor.SurveyHelper.getObjectName(obj);
        };
        SurveyObjects.intend = "...";
        return SurveyObjects;
    }());
    SurveyEditor.SurveyObjects = SurveyObjects;
})(SurveyEditor || (SurveyEditor = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRyYWdkcm9waGVscGVyLnRzIiwib2JqZWN0UHJvcGVydHlBcnJheXMudHMiLCJvYmplY3RQcm9wZXJ0eUl0ZW1WYWx1ZXMudHMiLCJvYmplY3RQcm9wZXJ0eVRyaWdnZXJzLnRzIiwib2JqZWN0UHJvcGVydHlWYWxpZGF0b3JzLnRzIiwic3VydmV5SGVscGVyLnRzIiwib2JqZWN0UHJvcGVydHlUZXh0SXRlbXMudHMiLCJvYmplY3RQcm9wZXJ0eU1hdHJpeERyb3Bkb3duQ29sdW1ucy50cyIsIm9iamVjdFByb3BlcnR5SHRtbC50cyIsIm9iamVjdFByb3BlcnR5LnRzIiwib2JqZWN0RWRpdG9yLnRzIiwicGFnZXNFZGl0b3IudHMiLCJ0ZXh0V29ya2VyLnRzIiwic3VydmV5RW1iZWRpbmdXaW5kb3cudHMiLCJvYmplY3RWZXJicy50cyIsInVuZG9yZWRvLnRzIiwidGVtcGxhdGVFZGl0b3Iua28uaHRtbC50cyIsInRlbXBsYXRlX3BhZ2UuaHRtbC50cyIsInRlbXBsYXRlX3F1ZXN0aW9uLmh0bWwudHMiLCJlZGl0b3IudHMiLCJlZGl0b3JMb2NhbGl6YXRpb24udHMiLCJqc29uNS50cyIsInN1cnZleU9iamVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7RUFJRTtBQUVGLElBQU8sWUFBWSxDQStJbEI7QUEvSUQsV0FBTyxZQUFZLEVBQUMsQ0FBQztJQUNqQjtRQUtJLHdCQUFtQixJQUFvQixFQUFFLGtCQUE2QjtZQUFuRCxTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUNuQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7UUFDakQsQ0FBQztRQUNELHNCQUFXLGtDQUFNO2lCQUFqQixjQUFxQyxNQUFNLENBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7V0FBQTtRQUNoRSw2Q0FBb0IsR0FBM0IsVUFBNEIsS0FBZ0IsRUFBRSxZQUFvQixFQUFFLFlBQW9CO1lBQ3BGLElBQUksQ0FBQyxPQUFPLENBQUMs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QyxHQUFHLENBQUMsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNqQixLQUFLLEdBQUc7b0JBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNoQixLQUFLLEdBQUc7b0JBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNmLE1BQU0sQ0FBQyxRQUFRLENBQUM7Z0JBQ3BCLEtBQUssR0FBRztvQkFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZixNQUFNLENBQUMs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LE1BQU0sSUFBSSxhQUFhLENBQUMsTUFBTSxDQUFDO1lBQ25DLENBQUM7WUFDRCxNQUFNLENBQUMsTUFBTSxHQUFHLHlCQUFZLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUF4SWEsb0JBQU0sR0FBVyxLQUFLLENBQUM7UUF5SXpDLG9CQUFDO0lBQUQsQ0ExSUEsQUEwSUMsSUFBQTtJQTFJWSwwQkFBYSxnQkEwSXpCLENBQUE7QUFDTCxDQUFDLEVBbEpNLFlBQVksS0FBWixZQUFZLFFBa0psQiIsImZpbGUiOiJzdXJ2ZXllZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcbiAgICBleHBvcnQgY2xhc3MgRHJhZ0Ryb3BIZWxwZXIge1xyXG4gICAgICAgIHN0YXRpYyBkYXRhU3RhcnQ6IHN0cmluZyA9IFwic3VydmV5anMsXCI7XHJcbiAgICAgICAgc3RhdGljIGRyYWdEYXRhOiBhbnkgPSB7dGV4dDogXCJcIiwganNvbjogbnVsbCB9O1xyXG4gICAgICAgIHN0YXRpYyBwcmV2RXZlbnQgPSB7IHF1ZXN0aW9uOiBudWxsLCB4OiAtMSwgeTogLTEgfTtcclxuICAgICAgICBwcml2YXRlIG9uTW9kaWZpZWRDYWxsYmFjazogKCkgPT4gYW55O1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkYXRhOiBTdXJ2ZXkuSVN1cnZleSwgb25Nb2RpZmllZENhbGxiYWNrOiAoKSA9PiBhbnkpIHtcclxuICAgICAgICAgICAgdGhpcy5vbk1vZGlmaWVkQ2FsbGJhY2sgPSBvbk1vZGlmaWVkQ2FsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgc3VydmV5KCk6IFN1cnZleS5TdXJ2ZXkgeyByZXR1cm4gPFN1cnZleS5TdXJ2ZXk+dGhpcy5kYXRhOyB9XHJcbiAgICAgICAgcHVibGljIHN0YXJ0RHJhZ05ld1F1ZXN0aW9uKGV2ZW50OiBEcmFnRXZlbnQsIHF1ZXN0aW9uVHlwZTogc3RyaW5nLCBxdWVzdGlvbk5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB0aGlzLnNldERhdGEoZXZlbnQsIERyYWdEcm9wSGVscGVyLmRhdGFTdGFydCArIFwicXVlc3Rpb250eXBlOlwiICsgcXVlc3Rpb25UeXBlICsgXCIscXVlc3Rpb25uYW1lOlwiICsgcXVlc3Rpb25OYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHN0YXJ0RHJhZ1F1ZXN0aW9uKGV2ZW50OiBEcmFnRXZlbnQsIHF1ZXN0aW9uTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YShldmVudCwgRHJhZ0Ryb3BIZWxwZXIuZGF0YVN0YXJ0ICsgXCJxdWVzdGlvbm5hbWU6XCIgKyBxdWVzdGlvbk5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgc3RhcnREcmFnQ29waWVkUXVlc3Rpb24oZXZlbnQ6IERyYWdFdmVudCwgcXVlc3Rpb25OYW1lOiBzdHJpbmcsIHF1ZXN0aW9uSnNvbjogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YShldmVudCwgRHJhZ0Ryb3BIZWxwZXIuZGF0YVN0YXJ0ICsgXCJxdWVzdGlvbm5hbWU6XCIgKyBxdWVzdGlvbk5hbWUsIHF1ZXN0aW9uSnNvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBpc1N1cnZleURyYWdnaW5nKGV2ZW50OiBEcmFnRXZlbnQpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgaWYgKCFldmVudCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZ2V0RGF0YShldmVudCkudGV4dDtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGEgJiYgZGF0YS5pbmRleE9mKERyYWdEcm9wSGVscGVyLmRhdGFTdGFydCkgPT0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGRvRHJhZ0Ryb3BPdmVyKGV2ZW50OiBEcmFnRXZlbnQsIHF1ZXN0aW9uOiBTdXJ2ZXkuUXVlc3Rpb25CYXNlKSB7XHJcbiAgICAgICAgICAgIGV2ZW50ID0gdGhpcy5nZXRFdmVudChldmVudCk7XHJcbiAgICAgICAgICAgIGlmICghcXVlc3Rpb24gfHwgIXRoaXMuaXNTdXJ2ZXlEcmFnZ2luZyhldmVudCkgfHwgdGhpcy5pc1NhbWVQbGFjZShldmVudCwgcXVlc3Rpb24pKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0UXVlc3Rpb25JbmRleChldmVudCwgcXVlc3Rpb24pO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleS5jdXJyZW50UGFnZVtcImtvRHJhZ2dpbmdcIl0oaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZG9Ecm9wKGV2ZW50OiBEcmFnRXZlbnQsIHF1ZXN0aW9uOiBTdXJ2ZXkuUXVlc3Rpb25CYXNlID0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzU3VydmV5RHJhZ2dpbmcoZXZlbnQpKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5LmN1cnJlbnRQYWdlW1wia29EcmFnZ2luZ1wiXSgtMSk7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0UXVlc3Rpb25JbmRleChldmVudCwgcXVlc3Rpb24pO1xyXG4gICAgICAgICAgICB2YXIgZGF0YUluZm8gPSB0aGlzLmdldERhdGFJbmZvKGV2ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhckRhdGEoKTtcclxuICAgICAgICAgICAgaWYgKCFkYXRhSW5mbykgcmV0dXJuO1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0UXVlc3Rpb24gPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIganNvbiA9IGRhdGFJbmZvW1wianNvblwiXTtcclxuICAgICAgICAgICAgaWYgKGpzb24pIHtcclxuICAgICAgICAgICAgICAgIHRhcmdldFF1ZXN0aW9uID0gU3VydmV5LlF1ZXN0aW9uRmFjdG9yeS5JbnN0YW5jZS5jcmVhdGVRdWVzdGlvbihqc29uW1widHlwZVwiXSwgbmFtZSk7XHJcbiAgICAgICAgICAgICAgICBuZXcgU3VydmV5Lkpzb25PYmplY3QoKS50b09iamVjdChqc29uLCB0YXJnZXRRdWVzdGlvbik7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRRdWVzdGlvbi5uYW1lID0gZGF0YUluZm9bXCJxdWVzdGlvbm5hbWVcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRRdWVzdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0UXVlc3Rpb24gPSA8U3VydmV5LlF1ZXN0aW9uQmFzZT50aGlzLnN1cnZleS5nZXRRdWVzdGlvbkJ5TmFtZShkYXRhSW5mb1tcInF1ZXN0aW9ubmFtZVwiXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRRdWVzdGlvbiAmJiBkYXRhSW5mb1tcInF1ZXN0aW9udHlwZVwiXSkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0UXVlc3Rpb24gPSBTdXJ2ZXkuUXVlc3Rpb25GYWN0b3J5Lkluc3RhbmNlLmNyZWF0ZVF1ZXN0aW9uKGRhdGFJbmZvW1wicXVlc3Rpb250eXBlXCJdLCBkYXRhSW5mb1tcInF1ZXN0aW9ubmFtZVwiXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRRdWVzdGlvbikgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVRdWVzdGlvblRvKHRhcmdldFF1ZXN0aW9uLCBpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0UXVlc3Rpb25JbmRleChldmVudDogRHJhZ0V2ZW50LCBxdWVzdGlvbjogU3VydmV5LlF1ZXN0aW9uQmFzZSkge1xyXG4gICAgICAgICAgICB2YXIgcGFnZSA9IHRoaXMuc3VydmV5LmN1cnJlbnRQYWdlO1xyXG4gICAgICAgICAgICBpZiAoIXF1ZXN0aW9uKSByZXR1cm4gcGFnZS5xdWVzdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYWdlLnF1ZXN0aW9ucy5pbmRleE9mKHF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgZXZlbnQgPSB0aGlzLmdldEV2ZW50KGV2ZW50KTtcclxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IDxudW1iZXI+ZXZlbnQuY3VycmVudFRhcmdldFtcImNsaWVudEhlaWdodFwiXTtcclxuICAgICAgICAgICAgdmFyIHkgPSBldmVudC5vZmZzZXRZO1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuaGFzT3duUHJvcGVydHkoJ2xheWVyWCcpKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0gZXZlbnQubGF5ZXJZIC0gPG51bWJlcj5ldmVudC5jdXJyZW50VGFyZ2V0W1wib2Zmc2V0VG9wXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh5ID4gaGVpZ2h0IC8gMikgaW5kZXgrK1xyXG4gICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgaXNTYW1lUGxhY2UoZXZlbnQ6IERyYWdFdmVudCwgcXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgdmFyIHByZXYgPSBEcmFnRHJvcEhlbHBlci5wcmV2RXZlbnQ7XHJcbiAgICAgICAgICAgIGlmIChwcmV2LnF1ZXN0aW9uICE9IHF1ZXN0aW9uIHx8IE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSBwcmV2LngpID4gNSB8fCBNYXRoLmFicyhldmVudC5jbGllbnRZIC0gcHJldi55KSA+IDUpIHtcclxuICAgICAgICAgICAgICAgIHByZXYucXVlc3Rpb24gPSBxdWVzdGlvbjtcclxuICAgICAgICAgICAgICAgIHByZXYueCA9IGV2ZW50LmNsaWVudFg7XHJcbiAgICAgICAgICAgICAgICBwcmV2LnkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldEV2ZW50KGV2ZW50OiBEcmFnRXZlbnQpOiBEcmFnRXZlbnQge1xyXG4gICAgICAgICAgICByZXR1cm4gZXZlbnRbXCJvcmlnaW5hbEV2ZW50XCJdID8gZXZlbnRbXCJvcmlnaW5hbEV2ZW50XCJdIDogZXZlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgbW92ZVF1ZXN0aW9uVG8odGFyZ2V0UXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UsIGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICAgICAgaWYgKHRhcmdldFF1ZXN0aW9uID09IG51bGwpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSB0aGlzLnN1cnZleS5nZXRQYWdlQnlRdWVzdGlvbih0YXJnZXRRdWVzdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChwYWdlKSB7XHJcbiAgICAgICAgICAgICAgICBwYWdlLnJlbW92ZVF1ZXN0aW9uKHRhcmdldFF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnN1cnZleS5jdXJyZW50UGFnZS5hZGRRdWVzdGlvbih0YXJnZXRRdWVzdGlvbiwgaW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vbk1vZGlmaWVkQ2FsbGJhY2spIHRoaXMub25Nb2RpZmllZENhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0RGF0YUluZm8oZXZlbnQ6IERyYWdFdmVudCk6IGFueSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gdGhpcy5nZXREYXRhKGV2ZW50KTtcclxuICAgICAgICAgICAgaWYgKCFkYXRhKSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgdmFyIHRleHQgPSBkYXRhLnRleHQuc3Vic3RyKERyYWdEcm9wSGVscGVyLmRhdGFTdGFydC5sZW5ndGgpO1xyXG4gICAgICAgICAgICB2YXIgYXJyYXkgPSB0ZXh0LnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7anNvbjogbnVsbH07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gYXJyYXlbaV0uc3BsaXQoJzonKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtpdGVtWzBdXSA9IGl0ZW1bMV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0Lmpzb24gPSBkYXRhLmpzb247XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0WShlbGVtZW50OiBIVE1MRWxlbWVudCk6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSAwO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAoZWxlbWVudC5vZmZzZXRUb3AgLSBlbGVtZW50LnNjcm9sbFRvcCArIGVsZW1lbnQuY2xpZW50VG9wKTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSA8SFRNTEVsZW1lbnQ+ZWxlbWVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzZXREYXRhKGV2ZW50OiBEcmFnRXZlbnQsIHRleHQ6IHN0cmluZywganNvbjogYW55ID0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnRbXCJvcmlnaW5hbEV2ZW50XCJdKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudCA9IGV2ZW50W1wib3JpZ2luYWxFdmVudFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIlRleHRcIiwgdGV4dCk7XHJcbiAgICAgICAgICAgICAgICBldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwiY29weVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIERyYWdEcm9wSGVscGVyLmRyYWdEYXRhID0geyB0ZXh0OiB0ZXh0LCBqc29uOiBqc29uIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0RGF0YShldmVudDogRHJhZ0V2ZW50KTogYW55IHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50W1wib3JpZ2luYWxFdmVudFwiXSkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBldmVudFtcIm9yaWdpbmFsRXZlbnRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIlRleHRcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIERyYWdEcm9wSGVscGVyLmRyYWdEYXRhLnRleHQgPSB0ZXh0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBEcmFnRHJvcEhlbHBlci5kcmFnRGF0YTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBjbGVhckRhdGEoKSB7XHJcbiAgICAgICAgICAgIERyYWdEcm9wSGVscGVyLmRyYWdEYXRhID0ge3RleHQ6IFwiXCIsIGpzb246IG51bGx9O1xyXG4gICAgICAgICAgICB2YXIgcHJldiA9IERyYWdEcm9wSGVscGVyLnByZXZFdmVudDtcclxuICAgICAgICAgICAgcHJldi5xdWVzdGlvbiA9IG51bGw7XHJcbiAgICAgICAgICAgIHByZXYueCA9IC0xO1xyXG4gICAgICAgICAgICBwcmV2LnkgPSAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcbiAgICBleHBvcnQgZGVjbGFyZSB0eXBlIFN1cnZleVByb3BlcnR5VmFsdWVDaGFuZ2VkQ2FsbGJhY2sgPSAobmV3VmFsdWU6IGFueSkgPT4gdm9pZDtcclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlQcm9wZXJ0eUFycmF5IHtcclxuICAgICAgICBwdWJsaWMgb2JqZWN0OiBhbnkgPSBudWxsO1xyXG4gICAgICAgIHB1YmxpYyB0aXRsZTogYW55O1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvblZhbHVlQ2hhbmdlZDogU3VydmV5UHJvcGVydHlWYWx1ZUNoYW5nZWRDYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0ga28ub2JzZXJ2YWJsZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHsgfVxyXG4gICAgfVxyXG59XHJcbiIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0UHJvcGVydHlBcnJheXMudHNcIiAvPlxyXG5cclxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleVByb3BlcnR5SXRlbVZhbHVlcyBleHRlbmRzIFN1cnZleVByb3BlcnR5QXJyYXl7XHJcbiAgICAgICAgcHJpdmF0ZSB2YWx1ZV86IEFycmF5PGFueT47XHJcbiAgICAgICAgcHVibGljIGtvSXRlbXM6IGFueTtcclxuICAgICAgICBwdWJsaWMgb25EZWxldGVDbGljazogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvbkFkZENsaWNrOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uQ2xlYXJDbGljazogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvbkFwcGx5Q2xpY2s6IGFueTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIG9uVmFsdWVDaGFuZ2VkOiBTdXJ2ZXlQcm9wZXJ0eVZhbHVlQ2hhbmdlZENhbGxiYWNrKSAge1xyXG4gICAgICAgICAgICBzdXBlcihvblZhbHVlQ2hhbmdlZCk7XHJcbiAgICAgICAgICAgIHRoaXMua29JdGVtcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHNlbGYub25BcHBseUNsaWNrID0gZnVuY3Rpb24gKCkgeyBzZWxmLkFwcGx5KCk7IH07XHJcbiAgICAgICAgICAgIHNlbGYub25EZWxldGVDbGljayA9IGZ1bmN0aW9uIChpdGVtKSB7IHNlbGYua29JdGVtcy5yZW1vdmUoaXRlbSk7IH07XHJcbiAgICAgICAgICAgIHNlbGYub25DbGVhckNsaWNrID0gZnVuY3Rpb24gKGl0ZW0pIHsgc2VsZi5rb0l0ZW1zLnJlbW92ZUFsbCgpOyB9O1xyXG4gICAgICAgICAgICBzZWxmLm9uQWRkQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYuQWRkSXRlbSgpOyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0IHZhbHVlKCk6IGFueSB7IHJldHVybiB0aGlzLnZhbHVlXzsgfVxyXG4gICAgICAgIHB1YmxpYyBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHZhbHVlID0gW107XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVfID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHZhciBhcnJheSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHZhbHVlW2ldO1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1WYWx1ZSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbVRleHQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0udmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtVmFsdWUgPSBpdGVtLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1UZXh0ID0gaXRlbS50ZXh0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaCh7IGtvVmFsdWU6IGtvLm9ic2VydmFibGUoaXRlbVZhbHVlKSwga29UZXh0OiBrby5vYnNlcnZhYmxlKGl0ZW1UZXh0KSwga29IYXNFcnJvcjoga28ub2JzZXJ2YWJsZShmYWxzZSkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zKGFycmF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIEFkZEl0ZW0oKSB7XHJcbiAgICAgICAgICAgIHRoaXMua29JdGVtcy5wdXNoKHsga29WYWx1ZToga28ub2JzZXJ2YWJsZSgpLCBrb1RleHQ6IGtvLm9ic2VydmFibGUoKSwga29IYXNFcnJvcjoga28ub2JzZXJ2YWJsZShmYWxzZSkgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByb3RlY3RlZCBBcHBseSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaGFzRXJyb3IoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMua29JdGVtcygpLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHRoaXMua29JdGVtcygpW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0ua29UZXh0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlXy5wdXNoKHsgdmFsdWU6IGl0ZW0ua29WYWx1ZSgpLCB0ZXh0OiBpdGVtLmtvVGV4dCgpIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlXy5wdXNoKGl0ZW0ua29WYWx1ZSgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5vblZhbHVlQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblZhbHVlQ2hhbmdlZCh0aGlzLnZhbHVlXyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGhhc0Vycm9yKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rb0l0ZW1zKCkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gdGhpcy5rb0l0ZW1zKClbaV07XHJcbiAgICAgICAgICAgICAgICBpdGVtLmtvSGFzRXJyb3IoIWl0ZW0ua29WYWx1ZSgpKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCB8fCBpdGVtLmtvSGFzRXJyb3IoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5UHJvcGVydHlUcmlnZ2VycyBleHRlbmRzIFN1cnZleVByb3BlcnR5QXJyYXkge1xyXG4gICAgICAgIHByaXZhdGUgdmFsdWVfOiBBcnJheTxhbnk+O1xyXG4gICAgICAgIHB1YmxpYyBrb0l0ZW1zOiBhbnk7XHJcbiAgICAgICAga29RdWVzdGlvbnM6IGFueTsga29QYWdlczogYW55O1xyXG4gICAgICAgIHB1YmxpYyBrb1NlbGVjdGVkOiBhbnk7XHJcbiAgICAgICAgcHVibGljIGF2YWlsYWJsZVRyaWdnZXJzOiBBcnJheTxzdHJpbmc+ID0gW107XHJcbiAgICAgICAgcHVibGljIG9uRGVsZXRlQ2xpY2s6IGFueTtcclxuICAgICAgICBwdWJsaWMgb25BZGRDbGljazogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvbkFwcGx5Q2xpY2s6IGFueTtcclxuICAgICAgICBwcml2YXRlIHRyaWdnZXJDbGFzc2VzOiBBcnJheTxTdXJ2ZXkuSnNvbk1ldGFkYXRhQ2xhc3M+ID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvblZhbHVlQ2hhbmdlZDogU3VydmV5UHJvcGVydHlWYWx1ZUNoYW5nZWRDYWxsYmFjaykge1xyXG4gICAgICAgICAgICBzdXBlcihvblZhbHVlQ2hhbmdlZCk7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zID0ga28ub2JzZXJ2YWJsZUFycmF5KCk7XHJcbiAgICAgICAgICAgIHRoaXMua29TZWxlY3RlZCA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICAgICAgICAgIHRoaXMua29QYWdlcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtvUXVlc3Rpb25zID0ga28ub2JzZXJ2YWJsZUFycmF5KCk7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckNsYXNzZXMgPSBTdXJ2ZXkuSnNvbk9iamVjdC5tZXRhRGF0YS5nZXRDaGlsZHJlbkNsYXNzZXMoXCJzdXJ2ZXl0cmlnZ2VyXCIsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmF2YWlsYWJsZVRyaWdnZXJzID0gdGhpcy5nZXRBdmFpbGFibGVUcmlnZ2VycygpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLm9uRGVsZXRlQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYua29JdGVtcy5yZW1vdmUoc2VsZi5rb1NlbGVjdGVkKCkpOyB9XHJcbiAgICAgICAgICAgIHRoaXMub25BZGRDbGljayA9IGZ1bmN0aW9uICh0cmlnZ2VyVHlwZSkgeyBzZWxmLmFkZEl0ZW0odHJpZ2dlclR5cGUpOyB9XHJcbiAgICAgICAgICAgIHRoaXMub25BcHBseUNsaWNrID0gZnVuY3Rpb24gKCkgeyBzZWxmLmFwcGx5KCk7IH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgdmFsdWUoKTogYW55IHsgcmV0dXJuIHRoaXMudmFsdWVfOyB9XHJcbiAgICAgICAgcHVibGljIHNldCB2YWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8ICFBcnJheS5pc0FycmF5KHZhbHVlKSkgdmFsdWUgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZV8gPSB2YWx1ZTtcclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rb1BhZ2VzKHRoaXMuZ2V0TmFtZXMoKDxTdXJ2ZXkuU3VydmV5PnRoaXMub2JqZWN0KS5wYWdlcykpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rb1F1ZXN0aW9ucyh0aGlzLmdldE5hbWVzKCg8U3VydmV5LlN1cnZleT50aGlzLm9iamVjdCkuZ2V0QWxsUXVlc3Rpb25zKCkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIganNvbk9iaiA9IG5ldyBTdXJ2ZXkuSnNvbk9iamVjdCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJpZ2dlciA9IFN1cnZleS5Kc29uT2JqZWN0Lm1ldGFEYXRhLmNyZWF0ZUNsYXNzKHZhbHVlW2ldLmdldFR5cGUoKSk7XHJcbiAgICAgICAgICAgICAgICBqc29uT2JqLnRvT2JqZWN0KHZhbHVlW2ldLCB0cmlnZ2VyKTtcclxuICAgICAgICAgICAgICAgIGFycmF5LnB1c2godGhpcy5jcmVhdGVQcm9wZXJ0eVRyaWdnZXIoPFN1cnZleS5TdXJ2ZXlUcmlnZ2VyPnRyaWdnZXIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmtvSXRlbXMoYXJyYXkpO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQoYXJyYXkubGVuZ3RoID4gMCA/IGFycmF5WzBdIDogbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgYXBwbHkoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVfID0gW107XHJcbiAgICAgICAgICAgIHZhciBhcnJheSA9IHRoaXMua29JdGVtcygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlXy5wdXNoKGFycmF5W2ldLmNyZWF0ZVRyaWdnZXIoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMub25WYWx1ZUNoYW5nZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25WYWx1ZUNoYW5nZWQodGhpcy52YWx1ZV8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0QXZhaWxhYmxlVHJpZ2dlcnMoKTogQXJyYXk8c3RyaW5nPiB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRyaWdnZXJDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh0aGlzLnRyaWdnZXJDbGFzc2VzW2ldLm5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0TmFtZXMoaXRlbXM6IEFycmF5PGFueT4pOiBBcnJheTxzdHJpbmc+IHtcclxuICAgICAgICAgICAgdmFyIG5hbWVzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gaXRlbXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVtcIm5hbWVcIl0pIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lcy5wdXNoKGl0ZW1bXCJuYW1lXCJdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgYWRkSXRlbSh0cmlnZ2VyVHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmlnZ2VyID0gU3VydmV5Lkpzb25PYmplY3QubWV0YURhdGEuY3JlYXRlQ2xhc3ModHJpZ2dlclR5cGUpO1xyXG4gICAgICAgICAgICB2YXIgdHJpZ2dlckl0ZW0gPSB0aGlzLmNyZWF0ZVByb3BlcnR5VHJpZ2dlcih0cmlnZ2VyKTtcclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zLnB1c2godHJpZ2dlckl0ZW0pO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQodHJpZ2dlckl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGNyZWF0ZVByb3BlcnR5VHJpZ2dlcih0cmlnZ2VyOiBTdXJ2ZXkuU3VydmV5VHJpZ2dlcik6IFN1cnZleVByb3BlcnR5VHJpZ2dlciB7XHJcbiAgICAgICAgICAgIHZhciB0cmlnZ2VySXRlbSA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmICh0cmlnZ2VyLmdldFR5cGUoKSA9PSBcInZpc2libGV0cmlnZ2VyXCIpIHtcclxuICAgICAgICAgICAgICAgIHRyaWdnZXJJdGVtID0gbmV3IFN1cnZleVByb3BlcnR5VmlzaWJsZVRyaWdnZXIoPFN1cnZleS5TdXJ2ZXlUcmlnZ2VyVmlzaWJsZT50cmlnZ2VyLCB0aGlzLmtvUGFnZXMsIHRoaXMua29RdWVzdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0cmlnZ2VyLmdldFR5cGUoKSA9PSBcInNldHZhbHVldHJpZ2dlclwiKSB7XHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VySXRlbSA9IG5ldyBTdXJ2ZXlQcm9wZXJ0eVNldFZhbHVlVHJpZ2dlcig8U3VydmV5LlN1cnZleVRyaWdnZXJTZXRWYWx1ZT50cmlnZ2VyLCB0aGlzLmtvUXVlc3Rpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRyaWdnZXJJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VySXRlbSA9IG5ldyBTdXJ2ZXlQcm9wZXJ0eVRyaWdnZXIodHJpZ2dlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRyaWdnZXJJdGVtO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5UHJvcGVydHlUcmlnZ2VyIHtcclxuICAgICAgICBwcml2YXRlIG9wZXJhdG9ycyA9IFtcImVtcHR5XCIsIFwibm90ZW1wdHlcIiwgXCJlcXVhbFwiLCBcIm5vdGVxdWFsXCIsIFwiY29udGFpbnNcIiwgXCJub25jb250YWluc1wiLCBcImdyZWF0ZXJcIiwgXCJsZXNzXCIsIFwiZ3JlYXRlcm9yZXF1YWxcIiwgXCJsZXNzb3JlcXVhbFwiXTtcclxuICAgICAgICBwcml2YXRlIHRyaWdnZXJUeXBlOiBzdHJpbmc7XHJcbiAgICAgICAgYXZhaWxhYmxlT3BlcmF0b3JzID0gW107XHJcbiAgICAgICAga29OYW1lOiBhbnk7IGtvT3BlcmF0b3I6IGFueTsga29WYWx1ZTogYW55OyBrb1R5cGU6IGFueTtcclxuICAgICAgICBrb1RleHQ6IGFueTsga29Jc1ZhbGlkOiBhbnk7IGtvUmVxdWlyZVZhbHVlOiBhbnk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB0cmlnZ2VyOiBTdXJ2ZXkuU3VydmV5VHJpZ2dlcikge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZU9wZXJhdG9ycygpO1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJUeXBlID0gdHJpZ2dlci5nZXRUeXBlKCk7XHJcbiAgICAgICAgICAgIHRoaXMua29UeXBlID0ga28ub2JzZXJ2YWJsZSh0aGlzLnRyaWdnZXJUeXBlKTtcclxuICAgICAgICAgICAgdGhpcy5rb05hbWUgPSBrby5vYnNlcnZhYmxlKHRyaWdnZXIubmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29PcGVyYXRvciA9IGtvLm9ic2VydmFibGUodHJpZ2dlci5vcGVyYXRvcik7XHJcbiAgICAgICAgICAgIHRoaXMua29WYWx1ZSA9IGtvLm9ic2VydmFibGUodHJpZ2dlci52YWx1ZSk7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5rb1JlcXVpcmVWYWx1ZSA9IGtvLmNvbXB1dGVkKCgpID0+IHsgcmV0dXJuIHNlbGYua29PcGVyYXRvcigpICE9IFwiZW1wdHlcIiAmJiBzZWxmLmtvT3BlcmF0b3IoKSAhPSBcIm5vdGVtcHR5XCI7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLmtvSXNWYWxpZCA9IGtvLmNvbXB1dGVkKCgpID0+IHsgaWYgKHNlbGYua29OYW1lKCkgJiYgKCFzZWxmLmtvUmVxdWlyZVZhbHVlKCkgfHwgc2VsZi5rb1ZhbHVlKCkpKSByZXR1cm4gdHJ1ZTsgcmV0dXJuIGZhbHNlOyB9KTtcclxuICAgICAgICAgICAgdGhpcy5rb1RleHQgPSBrby5jb21wdXRlZCgoKSA9PiB7IHNlbGYua29OYW1lKCk7IHNlbGYua29PcGVyYXRvcigpOyBzZWxmLmtvVmFsdWUoKTsgcmV0dXJuIHNlbGYuZ2V0VGV4dCgpOyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGNyZWF0ZVRyaWdnZXIoKTogU3VydmV5LlN1cnZleVRyaWdnZXIge1xyXG4gICAgICAgICAgICB2YXIgdHJpZ2dlciA9IDxTdXJ2ZXkuU3VydmV5VHJpZ2dlcj5TdXJ2ZXkuSnNvbk9iamVjdC5tZXRhRGF0YS5jcmVhdGVDbGFzcyh0aGlzLnRyaWdnZXJUeXBlKTtcclxuICAgICAgICAgICAgdHJpZ2dlci5uYW1lID0gdGhpcy5rb05hbWUoKTtcclxuICAgICAgICAgICAgdHJpZ2dlci5vcGVyYXRvciA9IHRoaXMua29PcGVyYXRvcigpO1xyXG4gICAgICAgICAgICB0cmlnZ2VyLnZhbHVlID0gdGhpcy5rb1ZhbHVlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cmlnZ2VyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGNyZWF0ZU9wZXJhdG9ycygpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9wZXJhdG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm9wZXJhdG9yc1tpXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlT3BlcmF0b3JzLnB1c2goeyBuYW1lOiBuYW1lLCB0ZXh0OiBlZGl0b3JMb2NhbGl6YXRpb24uZ2V0U3RyaW5nKFwib3AuXCIgKyBuYW1lKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFRleHQoKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmtvSXNWYWxpZCgpKSByZXR1cm4gZWRpdG9yTG9jYWxpemF0aW9uLmdldFN0cmluZyhcInBlLnRyaWdnZXJOb3RTZXRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3JMb2NhbGl6YXRpb24uZ2V0U3RyaW5nKFwicGUudHJpZ2dlclJ1bklmXCIpICsgXCIgJ1wiICsgdGhpcy5rb05hbWUoKSArIFwiJyBcIiArIHRoaXMuZ2V0T3BlcmF0b3JUZXh0KCkgKyB0aGlzLmdldFZhbHVlVGV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldE9wZXJhdG9yVGV4dCgpOiBzdHJpbmcge1xyXG4gICAgICAgICAgICB2YXIgb3AgPSB0aGlzLmtvT3BlcmF0b3IoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmF2YWlsYWJsZU9wZXJhdG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlT3BlcmF0b3JzW2ldLm5hbWUgPT0gb3ApIHJldHVybiB0aGlzLmF2YWlsYWJsZU9wZXJhdG9yc1tpXS50ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBnZXRWYWx1ZVRleHQoKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmtvUmVxdWlyZVZhbHVlKCkpIHJldHVybiBcIlwiO1xyXG4gICAgICAgICAgICByZXR1cm4gXCIgXCIgKyB0aGlzLmtvVmFsdWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleVByb3BlcnR5VmlzaWJsZVRyaWdnZXIgZXh0ZW5kcyBTdXJ2ZXlQcm9wZXJ0eVRyaWdnZXIge1xyXG4gICAgICAgIHB1YmxpYyBwYWdlczogU3VydmV5UHJvcGVydHlUcmlnZ2VyT2JqZWN0cztcclxuICAgICAgICBwdWJsaWMgcXVlc3Rpb25zOiBTdXJ2ZXlQcm9wZXJ0eVRyaWdnZXJPYmplY3RzO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB0cmlnZ2VyOiBTdXJ2ZXkuU3VydmV5VHJpZ2dlclZpc2libGUsIGtvUGFnZXM6IGFueSwga29RdWVzdGlvbnM6IGFueSkge1xyXG4gICAgICAgICAgICBzdXBlcih0cmlnZ2VyKTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlcyA9IG5ldyBTdXJ2ZXlQcm9wZXJ0eVRyaWdnZXJPYmplY3RzKGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcoXCJwZS50cmlnZ2VyTWFrZVBhZ2VzVmlzaWJsZVwiKSwga29QYWdlcygpLCB0cmlnZ2VyLnBhZ2VzICk7XHJcbiAgICAgICAgICAgIHRoaXMucXVlc3Rpb25zID0gbmV3IFN1cnZleVByb3BlcnR5VHJpZ2dlck9iamVjdHMoZWRpdG9yTG9jYWxpemF0aW9uLmdldFN0cmluZyhcInBlLnRyaWdnZXJNYWtlUXVlc3Rpb25zVmlzaWJsZVwiKSwga29RdWVzdGlvbnMoKSwgdHJpZ2dlci5xdWVzdGlvbnMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGNyZWF0ZVRyaWdnZXIoKTogU3VydmV5LlN1cnZleVRyaWdnZXIge1xyXG4gICAgICAgICAgICB2YXIgdHJpZ2dlciA9IDxTdXJ2ZXkuU3VydmV5VHJpZ2dlclZpc2libGU+c3VwZXIuY3JlYXRlVHJpZ2dlcigpO1xyXG4gICAgICAgICAgICB0cmlnZ2VyLnBhZ2VzID0gdGhpcy5wYWdlcy5rb0Nob29zZW4oKTtcclxuICAgICAgICAgICAgdHJpZ2dlci5xdWVzdGlvbnMgPSB0aGlzLnF1ZXN0aW9ucy5rb0Nob29zZW4oKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRyaWdnZXI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlQcm9wZXJ0eVNldFZhbHVlVHJpZ2dlciBleHRlbmRzIFN1cnZleVByb3BlcnR5VHJpZ2dlciB7XHJcbiAgICAgICAga29RdWVzdGlvbnM6IGFueTsga29zZXRUb05hbWU6IGFueTsga29zZXRWYWx1ZTogYW55OyBrb2lzVmFyaWFibGU6IGFueTtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdHJpZ2dlcjogU3VydmV5LlN1cnZleVRyaWdnZXJTZXRWYWx1ZSwga29RdWVzdGlvbnM6IGFueSkge1xyXG4gICAgICAgICAgICBzdXBlcih0cmlnZ2VyKTtcclxuICAgICAgICAgICAgdGhpcy5rb1F1ZXN0aW9ucyA9IGtvUXVlc3Rpb25zO1xyXG4gICAgICAgICAgICB0aGlzLmtvc2V0VG9OYW1lID0ga28ub2JzZXJ2YWJsZSh0cmlnZ2VyLnNldFRvTmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29zZXRWYWx1ZSA9IGtvLm9ic2VydmFibGUodHJpZ2dlci5zZXRWYWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29pc1ZhcmlhYmxlID0ga28ub2JzZXJ2YWJsZSh0cmlnZ2VyLmlzVmFyaWFibGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgY3JlYXRlVHJpZ2dlcigpOiBTdXJ2ZXkuU3VydmV5VHJpZ2dlciB7XHJcbiAgICAgICAgICAgIHZhciB0cmlnZ2VyID0gPFN1cnZleS5TdXJ2ZXlUcmlnZ2VyU2V0VmFsdWU+c3VwZXIuY3JlYXRlVHJpZ2dlcigpO1xyXG4gICAgICAgICAgICB0cmlnZ2VyLnNldFRvTmFtZSA9IHRoaXMua29zZXRUb05hbWUoKTtcclxuICAgICAgICAgICAgdHJpZ2dlci5zZXRWYWx1ZSA9IHRoaXMua29zZXRWYWx1ZSgpO1xyXG4gICAgICAgICAgICB0cmlnZ2VyLmlzVmFyaWFibGUgPSB0aGlzLmtvaXNWYXJpYWJsZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJpZ2dlcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5UHJvcGVydHlUcmlnZ2VyT2JqZWN0cyB7XHJcbiAgICAgICAga29PYmplY3RzOiBhbnk7XHJcbiAgICAgICAga29DaG9vc2VuOiBhbnk7XHJcbiAgICAgICAga29TZWxlY3RlZDogYW55O1xyXG4gICAgICAgIGtvQ2hvb3NlblNlbGVjdGVkOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uRGVsZXRlQ2xpY2s6IGFueTtcclxuICAgICAgICBwdWJsaWMgb25BZGRDbGljazogYW55O1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB0aXRsZTogc3RyaW5nLCBhbGxPYmplY3RzOiBBcnJheTxzdHJpbmc+LCBjaG9vc2VuT2JqZWN0czogQXJyYXk8c3RyaW5nPikge1xyXG4gICAgICAgICAgICB0aGlzLmtvQ2hvb3NlbiA9IGtvLm9ic2VydmFibGVBcnJheShjaG9vc2VuT2JqZWN0cyk7XHJcbiAgICAgICAgICAgIHZhciBhcnJheSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbE9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gYWxsT2JqZWN0c1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChjaG9vc2VuT2JqZWN0cy5pbmRleE9mKGl0ZW0pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFycmF5LnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb09iamVjdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoYXJyYXkpO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKCk7XHJcbiAgICAgICAgICAgIHRoaXMua29DaG9vc2VuU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKCk7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5vbkRlbGV0ZUNsaWNrID0gZnVuY3Rpb24gKCkgeyBzZWxmLmRlbGV0ZUl0ZW0oKTsgfVxyXG4gICAgICAgICAgICB0aGlzLm9uQWRkQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYuYWRkSXRlbSgpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZGVsZXRlSXRlbSgpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VJdGVtcyh0aGlzLmtvQ2hvb3NlblNlbGVjdGVkKCksIHRoaXMua29DaG9vc2VuLCB0aGlzLmtvT2JqZWN0cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgYWRkSXRlbSgpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VJdGVtcyh0aGlzLmtvU2VsZWN0ZWQoKSwgdGhpcy5rb09iamVjdHMsIHRoaXMua29DaG9vc2VuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBjaGFuZ2VJdGVtcyhpdGVtOiBzdHJpbmcsIHJlbW92ZWRGcm9tOiBhbnksIGFkZFRvOiBhbnkpIHtcclxuICAgICAgICAgICAgcmVtb3ZlZEZyb20ucmVtb3ZlKGl0ZW0pO1xyXG4gICAgICAgICAgICBhZGRUby5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICByZW1vdmVkRnJvbS5zb3J0KCk7XHJcbiAgICAgICAgICAgIGFkZFRvLnNvcnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleVByb3BlcnR5VmFsaWRhdG9ycyBleHRlbmRzIFN1cnZleVByb3BlcnR5QXJyYXkge1xyXG4gICAgICAgIHByaXZhdGUgdmFsdWVfOiBBcnJheTxhbnk+O1xyXG4gICAgICAgIHByaXZhdGUgc2VsZWN0ZWRPYmplY3RFZGl0b3I6IFN1cnZleU9iamVjdEVkaXRvcjtcclxuICAgICAgICBwdWJsaWMga29JdGVtczogYW55O1xyXG4gICAgICAgIHB1YmxpYyBrb1NlbGVjdGVkOiBhbnk7XHJcbiAgICAgICAgcHVibGljIGF2YWlsYWJsZVZhbGlkYXRvcnM6IEFycmF5PHN0cmluZz4gPSBbXTtcclxuICAgICAgICBwdWJsaWMgb25EZWxldGVDbGljazogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvbkFkZENsaWNrOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uQXBwbHlDbGljazogYW55O1xyXG4gICAgICAgIHByaXZhdGUgdmFsaWRhdG9yQ2xhc3NlczogQXJyYXk8U3VydmV5Lkpzb25NZXRhZGF0YUNsYXNzPiA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb25WYWx1ZUNoYW5nZWQ6IFN1cnZleVByb3BlcnR5VmFsdWVDaGFuZ2VkQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgc3VwZXIob25WYWx1ZUNoYW5nZWQpO1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RFZGl0b3IgPSBuZXcgU3VydmV5T2JqZWN0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RFZGl0b3Iub25Qcm9wZXJ0eVZhbHVlQ2hhbmdlZC5hZGQoKHNlbmRlciwgb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vblByb3BlcnR5VmFsdWVDaGFuZ2VkKG9wdGlvbnMucHJvcGVydHksIG9wdGlvbnMub2JqZWN0LCBvcHRpb25zLm5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMua29JdGVtcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQuc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkgeyBzZWxmLnNlbGVjdGVkT2JqZWN0RWRpdG9yLnNlbGVjdGVkT2JqZWN0ID0gbmV3VmFsdWUgIT0gbnVsbCA/IG5ld1ZhbHVlLnZhbGlkYXRvciA6IG51bGw7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvckNsYXNzZXMgPSBTdXJ2ZXkuSnNvbk9iamVjdC5tZXRhRGF0YS5nZXRDaGlsZHJlbkNsYXNzZXMoXCJzdXJ2ZXl2YWxpZGF0b3JcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlVmFsaWRhdG9ycyA9IHRoaXMuZ2V0QXZhaWxhYmxlVmFsaWRhdG9ycygpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLm9uRGVsZXRlQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYua29JdGVtcy5yZW1vdmUoc2VsZi5rb1NlbGVjdGVkKCkpOyB9XHJcbiAgICAgICAgICAgIHRoaXMub25BZGRDbGljayA9IGZ1bmN0aW9uICh2YWxpZGF0b3JUeXBlKSB7IHNlbGYuYWRkSXRlbSh2YWxpZGF0b3JUeXBlKTsgfVxyXG4gICAgICAgICAgICB0aGlzLm9uQXBwbHlDbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5hcHBseSgpOyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0IHZhbHVlKCk6IGFueSB7IHJldHVybiB0aGlzLnZhbHVlXzsgfVxyXG4gICAgICAgIHB1YmxpYyBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHZhbHVlID0gW107XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVfID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHZhciBhcnJheSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIganNvbk9iaiA9IG5ldyBTdXJ2ZXkuSnNvbk9iamVjdCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gU3VydmV5Lkpzb25PYmplY3QubWV0YURhdGEuY3JlYXRlQ2xhc3ModmFsdWVbaV0uZ2V0VHlwZSgpKTtcclxuICAgICAgICAgICAgICAgIGpzb25PYmoudG9PYmplY3QodmFsdWVbaV0sIHZhbGlkYXRvcik7XHJcbiAgICAgICAgICAgICAgICBhcnJheS5wdXNoKG5ldyBTdXJ2ZXlQcm9wZXJ0eVZhbGlkYXRvckl0ZW0odmFsaWRhdG9yKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zKGFycmF5KTtcclxuICAgICAgICAgICAgdGhpcy5rb1NlbGVjdGVkKGFycmF5Lmxlbmd0aCA+IDAgPyBhcnJheVswXSA6IG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGFwcGx5KCkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgYXJyYXkgPSB0aGlzLmtvSXRlbXMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZV8ucHVzaChhcnJheVtpXS52YWxpZGF0b3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uVmFsdWVDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uVmFsdWVDaGFuZ2VkKHRoaXMudmFsdWVfKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGFkZEl0ZW0odmFsaWRhdG9yVHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWxpZGF0b3IgPSBuZXcgU3VydmV5UHJvcGVydHlWYWxpZGF0b3JJdGVtKFN1cnZleS5Kc29uT2JqZWN0Lm1ldGFEYXRhLmNyZWF0ZUNsYXNzKHZhbGlkYXRvclR5cGUpKTtcclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zLnB1c2gobmV3VmFsaWRhdG9yKTtcclxuICAgICAgICAgICAgdGhpcy5rb1NlbGVjdGVkKG5ld1ZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0QXZhaWxhYmxlVmFsaWRhdG9ycygpOiBBcnJheTxzdHJpbmc+IHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmFsaWRhdG9yQ2xhc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godGhpcy52YWxpZGF0b3JDbGFzc2VzW2ldLm5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgb25Qcm9wZXJ0eVZhbHVlQ2hhbmdlZChwcm9wZXJ0eTogU3VydmV5Lkpzb25PYmplY3RQcm9wZXJ0eSwgb2JqOiBhbnksIG5ld1ZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMua29TZWxlY3RlZCgpID09IG51bGwpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5rb1NlbGVjdGVkKCkudmFsaWRhdG9yW3Byb3BlcnR5Lm5hbWVdID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlQcm9wZXJ0eVZhbGlkYXRvckl0ZW0ge1xyXG4gICAgICAgIHB1YmxpYyB0ZXh0OiBzdHJpbmc7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHZhbGlkYXRvcjogU3VydmV5LlN1cnZleVZhbGlkYXRvcikge1xyXG4gICAgICAgICAgICB0aGlzLnRleHQgPSB2YWxpZGF0b3IuZ2V0VHlwZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcbiAgICBleHBvcnQgZW51bSBPYmpUeXBlIHsgVW5rbm93biwgU3VydmV5LCBQYWdlLCBRdWVzdGlvbiB9XHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5SGVscGVyIHtcclxuICAgICAgICBwdWJsaWMgc3RhdGljIGdldE5ld1BhZ2VOYW1lKG9ianM6IEFycmF5PGFueT4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFN1cnZleUhlbHBlci5nZXROZXdOYW1lKG9ianMsIGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcoXCJlZC5uZXdQYWdlTmFtZVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgZ2V0TmV3UXVlc3Rpb25OYW1lKG9ianM6IEFycmF5PGFueT4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFN1cnZleUhlbHBlci5nZXROZXdOYW1lKG9ianMsIGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcoXCJlZC5uZXdRdWVzdGlvbk5hbWVcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgc3RhdGljIGdldE5ld05hbWUob2JqczogQXJyYXk8YW55PiwgYmFzZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIHZhciBoYXNoID0ge307XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2Jqcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaGFzaFtvYmpzW2ldLm5hbWVdID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgbnVtID0gMTtcclxuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghaGFzaFtiYXNlTmFtZSArIG51bS50b1N0cmluZygpXSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBudW0rKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYmFzZU5hbWUgKyBudW0udG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBnZXRPYmplY3RUeXBlKG9iajogYW55KTogT2JqVHlwZSB7XHJcbiAgICAgICAgICAgIGlmICghb2JqIHx8ICFvYmpbXCJnZXRUeXBlXCJdKSByZXR1cm4gT2JqVHlwZS5Vbmtub3duO1xyXG4gICAgICAgICAgICBpZiAob2JqLmdldFR5cGUoKSA9PSBcInBhZ2VcIikgcmV0dXJuIE9ialR5cGUuUGFnZTtcclxuICAgICAgICAgICAgaWYgKG9iai5nZXRUeXBlKCkgPT0gXCJzdXJ2ZXlcIikgcmV0dXJuIE9ialR5cGUuU3VydmV5O1xyXG4gICAgICAgICAgICBpZiAob2JqW1wiZnVsbFRpdGxlXCJdKSByZXR1cm4gT2JqVHlwZS5RdWVzdGlvbjtcclxuICAgICAgICAgICAgcmV0dXJuIE9ialR5cGUuVW5rbm93bjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBnZXRPYmplY3ROYW1lKG9iajogYW55KTogc3RyaW5nIHtcclxuICAgICAgICAgICAgaWYgKG9ialtcIm5hbWVcIl0pIHJldHVybiBvYmpbXCJuYW1lXCJdO1xyXG4gICAgICAgICAgICB2YXIgb2JqVHlwZSA9IFN1cnZleUhlbHBlci5nZXRPYmplY3RUeXBlKG9iaik7XHJcbiAgICAgICAgICAgIGlmIChvYmpUeXBlICE9IE9ialR5cGUuUGFnZSkgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gPFN1cnZleS5TdXJ2ZXk+KDxTdXJ2ZXkuUGFnZT5vYmopLmRhdGE7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGRhdGEucGFnZXMuaW5kZXhPZig8U3VydmV5LlBhZ2U+b2JqKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiW1BhZ2UgXCIgKyAoaW5kZXggKyAxKSArIFwiXVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0UHJvcGVydHlBcnJheXMudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwic3VydmV5SGVscGVyLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdFByb3BlcnR5VmFsaWRhdG9ycy50c1wiIC8+XHJcblxyXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5UHJvcGVydHlUZXh0SXRlbXMgZXh0ZW5kcyBTdXJ2ZXlQcm9wZXJ0eUFycmF5IHtcclxuICAgICAgICBwcml2YXRlIHZhbHVlXzogQXJyYXk8YW55PjtcclxuICAgICAgICBwdWJsaWMga29JdGVtczogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvbkRlbGV0ZUNsaWNrOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uQWRkQ2xpY2s6IGFueTtcclxuICAgICAgICBwdWJsaWMgb25BcHBseUNsaWNrOiBhbnk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvblZhbHVlQ2hhbmdlZDogU3VydmV5UHJvcGVydHlWYWx1ZUNoYW5nZWRDYWxsYmFjaykge1xyXG4gICAgICAgICAgICBzdXBlcihvblZhbHVlQ2hhbmdlZCk7XHJcbiAgICAgICAgICAgIHRoaXMua29JdGVtcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHNlbGYub25BcHBseUNsaWNrID0gZnVuY3Rpb24gKCkgeyBzZWxmLkFwcGx5KCk7IH07XHJcbiAgICAgICAgICAgIHNlbGYub25EZWxldGVDbGljayA9IGZ1bmN0aW9uIChpdGVtKSB7IHNlbGYua29JdGVtcy5yZW1vdmUoaXRlbSk7IH07XHJcbiAgICAgICAgICAgIHNlbGYub25BZGRDbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5BZGRJdGVtKCk7IH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgdmFsdWUoKTogYW55IHsgcmV0dXJuIHRoaXMudmFsdWVfOyB9XHJcbiAgICAgICAgcHVibGljIHNldCB2YWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8ICFBcnJheS5pc0FycmF5KHZhbHVlKSkgdmFsdWUgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZV8gPSB2YWx1ZTtcclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gdmFsdWVbaV07XHJcbiAgICAgICAgICAgICAgICB2YXIgZWRpdEl0ZW0gPSB7IGtvTmFtZToga28ub2JzZXJ2YWJsZShpdGVtLm5hbWUpLCBrb1RpdGxlOiBrby5vYnNlcnZhYmxlKGl0ZW0udGl0bGUpIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVZhbGlkYXRvcnNFZGl0b3IoZWRpdEl0ZW0sIGl0ZW0udmFsaWRhdG9ycyk7XHJcbiAgICAgICAgICAgICAgICBhcnJheS5wdXNoKGVkaXRJdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmtvSXRlbXMoYXJyYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgQWRkSXRlbSgpIHtcclxuICAgICAgICAgICAgdmFyIG9ianMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gdGhpcy5rb0l0ZW1zKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG9ianMucHVzaCh7IG5hbWU6IGFycmF5W2ldLmtvTmFtZSgpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBlZGl0SXRlbSA9IHsga29OYW1lOiBrby5vYnNlcnZhYmxlKFN1cnZleUhlbHBlci5nZXROZXdOYW1lKG9ianMsIFwidGV4dFwiKSksIGtvVGl0bGU6IGtvLm9ic2VydmFibGUoKSB9O1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVZhbGlkYXRvcnNFZGl0b3IoZWRpdEl0ZW0sIFtdKTtcclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zLnB1c2goZWRpdEl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgQXBwbHkoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVfID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rb0l0ZW1zKCkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gdGhpcy5rb0l0ZW1zKClbaV07XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbVRleHQgPSBuZXcgU3VydmV5Lk11bHRpcGxlVGV4dEl0ZW0oaXRlbS5rb05hbWUoKSwgaXRlbS5rb1RpdGxlKCkpO1xyXG4gICAgICAgICAgICAgICAgaXRlbVRleHQudmFsaWRhdG9ycyA9IGl0ZW0udmFsaWRhdG9ycztcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVfLnB1c2goaXRlbVRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uVmFsdWVDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uVmFsdWVDaGFuZ2VkKHRoaXMudmFsdWVfKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGNyZWF0ZVZhbGlkYXRvcnNFZGl0b3IoaXRlbTogYW55LCB2YWxpZGF0b3JzOiBBcnJheTxhbnk+KSB7XHJcbiAgICAgICAgICAgIGl0ZW0udmFsaWRhdG9ycyA9IHZhbGlkYXRvcnMuc2xpY2UoKTtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgb25JdGVtQ2hhbmdlZCA9IGZ1bmN0aW9uIChuZXdWYWx1ZTogYW55KSB7IGl0ZW0udmFsaWRhdG9ycyA9IG5ld1ZhbHVlOyBpdGVtLmtvVGV4dChzZWxmLmdldFRleHQobmV3VmFsdWUubGVuZ3RoKSk7IH07XHJcbiAgICAgICAgICAgIGl0ZW0uYXJyYXlFZGl0b3IgPSBuZXcgU3VydmV5UHJvcGVydHlWYWxpZGF0b3JzKChuZXdWYWx1ZTogYW55KSA9PiB7IG9uSXRlbUNoYW5nZWQobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgaXRlbS5hcnJheUVkaXRvci5vYmplY3QgPSBpdGVtO1xyXG4gICAgICAgICAgICBpdGVtLmFycmF5RWRpdG9yLnRpdGxlKGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcoXCJwZS5lZGl0UHJvcGVydHlcIilbXCJmb3JtYXRcIl0oXCJWYWxpZGF0b3JzXCIpKTtcclxuICAgICAgICAgICAgaXRlbS5hcnJheUVkaXRvci52YWx1ZSA9IGl0ZW0udmFsaWRhdG9ycztcclxuICAgICAgICAgICAgaXRlbS5rb1RleHQgPSBrby5vYnNlcnZhYmxlKHRoaXMuZ2V0VGV4dCh2YWxpZGF0b3JzLmxlbmd0aCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFRleHQobGVuZ3RoOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yTG9jYWxpemF0aW9uLmdldFN0cmluZyhcInBlLml0ZW1zXCIpW1wiZm9ybWF0XCJdKGxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLyohXG4qIHN1cnZleWpzIEVkaXRvciB2MC45LjEwXG4qIChjKSBBbmRyZXcgVGVsbm92IC0gaHR0cDovL3N1cnZleWpzLm9yZy9idWlsZGVyL1xuKiBHaXRodWIgLSBodHRwczovL2dpdGh1Yi5jb20vYW5kcmV3dGVsbm92L3N1cnZleS5qcy5lZGl0b3JcbiovXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJvYmplY3RQcm9wZXJ0eUFycmF5cy50c1wiIC8+XHJcblxyXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5UHJvcGVydHlNYXRyaXhEcm9wZG93bkNvbHVtbnMgZXh0ZW5kcyBTdXJ2ZXlQcm9wZXJ0eUFycmF5IHtcclxuICAgICAgICBwcml2YXRlIHZhbHVlXzogQXJyYXk8YW55PjtcclxuICAgICAgICBwdWJsaWMga29JdGVtczogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvbkRlbGV0ZUNsaWNrOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uQWRkQ2xpY2s6IGFueTtcclxuICAgICAgICBwdWJsaWMgb25DbGVhckNsaWNrOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uQXBwbHlDbGljazogYW55O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb25WYWx1ZUNoYW5nZWQ6IFN1cnZleVByb3BlcnR5VmFsdWVDaGFuZ2VkQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgc3VwZXIob25WYWx1ZUNoYW5nZWQpO1xyXG4gICAgICAgICAgICB0aGlzLmtvSXRlbXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZV8gPSBbXTtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBzZWxmLm9uQXBwbHlDbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5BcHBseSgpOyB9O1xyXG4gICAgICAgICAgICBzZWxmLm9uRGVsZXRlQ2xpY2sgPSBmdW5jdGlvbiAoaXRlbSkgeyBzZWxmLmtvSXRlbXMucmVtb3ZlKGl0ZW0pOyB9O1xyXG4gICAgICAgICAgICBzZWxmLm9uQ2xlYXJDbGljayA9IGZ1bmN0aW9uIChpdGVtKSB7IHNlbGYua29JdGVtcy5yZW1vdmVBbGwoKTsgfTtcclxuICAgICAgICAgICAgc2VsZi5vbkFkZENsaWNrID0gZnVuY3Rpb24gKCkgeyBzZWxmLkFkZEl0ZW0oKTsgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCB2YWx1ZSgpOiBhbnkgeyByZXR1cm4gdGhpcy52YWx1ZV87IH1cclxuICAgICAgICBwdWJsaWMgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB2YWx1ZSA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlXyA9IHZhbHVlO1xyXG4gICAgICAgICAgICB2YXIgYXJyYXkgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaChuZXcgU3VydmV5UHJvcGVydHlNYXRyaXhEcm9wZG93bkNvbHVtbnNJdGVtKHZhbHVlW2ldKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zKGFycmF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIEFkZEl0ZW0oKSB7XHJcbiAgICAgICAgICAgIHRoaXMua29JdGVtcy5wdXNoKG5ldyBTdXJ2ZXlQcm9wZXJ0eU1hdHJpeERyb3Bkb3duQ29sdW1uc0l0ZW0obmV3IFN1cnZleS5NYXRyaXhEcm9wZG93bkNvbHVtbihcIlwiKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgQXBwbHkoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0Vycm9yKCkpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZV8gPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmtvSXRlbXMoKS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLmtvSXRlbXMoKVtpXTtcclxuICAgICAgICAgICAgICAgIGl0ZW0uYXBwbHkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVfLnB1c2goaXRlbS5jb2x1bW4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uVmFsdWVDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uVmFsdWVDaGFuZ2VkKHRoaXMudmFsdWVfKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgaGFzRXJyb3IoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmtvSXRlbXMoKS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0IHx8IHRoaXMua29JdGVtcygpW2ldLmhhc0Vycm9yKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjbGFzcyBTdXJ2ZXlQcm9wZXJ0eU1hdHJpeERyb3Bkb3duQ29sdW1uc0l0ZW0ge1xyXG4gICAgICAgIHByaXZhdGUga29DaG9pY2VzOiBhbnk7XHJcbiAgICAgICAgcHVibGljIGNob2ljZXNFZGl0b3I6IFN1cnZleVByb3BlcnR5SXRlbVZhbHVlcztcclxuICAgICAgICBrb05hbWU6IGFueTsga29UaXRsZTogYW55OyBrb0NlbGxUeXBlOiBhbnk7IGtvU2hvd0Nob2ljZXM6IGFueTtcclxuICAgICAgICBrb0hhc0Vycm9yOiBhbnk7IGtvQ29sQ291bnQ6IGFueTsga29Jc1JlcXVpcmVkOiBhbnk7IGtvSGFzT3RoZXI6IGFueTtcclxuICAgICAgICBrb0hhc0Nob2ljZXM6IGFueTsga29IYXNDb2xDb3VudDogYW55O1xyXG4gICAgICAgIHB1YmxpYyBvblNob3dDaG9pY2VzQ2xpY2s6IGFueTtcclxuICAgICAgICBwdWJsaWMgY2VsbFR5cGVDaG9pY2VzOiBBcnJheTxhbnk+O1xyXG4gICAgICAgIHB1YmxpYyBjb2xDb3VudENob2ljZXM6IEFycmF5PGFueT47XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIGNvbHVtbjogU3VydmV5Lk1hdHJpeERyb3Bkb3duQ29sdW1uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2VsbFR5cGVDaG9pY2VzID0gdGhpcy5nZXRQcm9wZXJ0eUNob2ljZXMoXCJjZWxsVHlwZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5jb2xDb3VudENob2ljZXMgPSB0aGlzLmdldFByb3BlcnR5Q2hvaWNlcyhcImNvbENvdW50XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmtvTmFtZSA9IGtvLm9ic2VydmFibGUoY29sdW1uLm5hbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmtvQ2VsbFR5cGUgPSBrby5vYnNlcnZhYmxlKGNvbHVtbi5jZWxsVHlwZSk7IFxyXG4gICAgICAgICAgICB0aGlzLmtvQ29sQ291bnQgPSBrby5vYnNlcnZhYmxlKGNvbHVtbi5jb2xDb3VudCk7XHJcbiAgICAgICAgICAgIHRoaXMua29Jc1JlcXVpcmVkID0ga28ub2JzZXJ2YWJsZShjb2x1bW5bXCJpc1JlcXVpcmVkXCJdID8gdHJ1ZSA6IGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5rb0hhc090aGVyID0ga28ub2JzZXJ2YWJsZShjb2x1bW5bXCJrb0hhc090aGVyXCJdID8gdHJ1ZSA6IGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5rb1RpdGxlID0ga28ub2JzZXJ2YWJsZShjb2x1bW4ubmFtZSA9PT0gY29sdW1uLnRpdGxlID8gXCJcIiA6IGNvbHVtbi50aXRsZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29TaG93Q2hvaWNlcyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLmtvQ2hvaWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShjb2x1bW4uY2hvaWNlcyk7XHJcbiAgICAgICAgICAgIHRoaXMua29IYXNFcnJvciA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLmNob2ljZXNFZGl0b3IgPSBuZXcgU3VydmV5UHJvcGVydHlJdGVtVmFsdWVzKG51bGwpO1xyXG4gICAgICAgICAgICB0aGlzLmNob2ljZXNFZGl0b3Iub2JqZWN0ID0gdGhpcy5jb2x1bW47XHJcbiAgICAgICAgICAgIHRoaXMuY2hvaWNlc0VkaXRvci52YWx1ZSA9IHRoaXMua29DaG9pY2VzKCk7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5vblNob3dDaG9pY2VzQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYua29TaG93Q2hvaWNlcyghc2VsZi5rb1Nob3dDaG9pY2VzKCkpOyB9XHJcbiAgICAgICAgICAgIHRoaXMua29IYXNDaG9pY2VzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5rb0NlbGxUeXBlKCkgPT0gXCJkcm9wZG93blwiIHx8IHNlbGYua29DZWxsVHlwZSgpID09IFwiY2hlY2tib3hcIiB8fCBzZWxmLmtvQ2VsbFR5cGUoKSA9PSBcInJhZGlvZ3JvdXBcIjsgfSk7XHJcbiAgICAgICAgICAgIHRoaXMua29IYXNDb2xDb3VudCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYua29DZWxsVHlwZSgpID09IFwiY2hlY2tib3hcIiB8fCBzZWxmLmtvQ2VsbFR5cGUoKSA9PSBcInJhZGlvZ3JvdXBcIjsgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBoYXNFcnJvcigpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgdGhpcy5rb0hhc0Vycm9yKCF0aGlzLmtvTmFtZSgpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMua29IYXNFcnJvcigpIHx8IHRoaXMuY2hvaWNlc0VkaXRvci5oYXNFcnJvcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgYXBwbHkoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29sdW1uLm5hbWUgPSB0aGlzLmtvTmFtZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbHVtbi50aXRsZSA9IHRoaXMua29UaXRsZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbHVtbi5jZWxsVHlwZSA9IHRoaXMua29DZWxsVHlwZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbHVtbi5jb2xDb3VudCA9IHRoaXMua29Db2xDb3VudCgpO1xyXG4gICAgICAgICAgICAvL1RPRE9cclxuICAgICAgICAgICAgdGhpcy5jb2x1bW5bXCJpc1JlcXVpcmVkXCJdID0gdGhpcy5rb0lzUmVxdWlyZWQoKTtcclxuICAgICAgICAgICAgdGhpcy5jb2x1bW5bXCJoYXNPdGhlclwiXSA9IHRoaXMua29IYXNPdGhlcigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jaG9pY2VzRWRpdG9yLm9uQXBwbHlDbGljaygpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbHVtbi5jaG9pY2VzID0gdGhpcy5jaG9pY2VzRWRpdG9yLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFByb3BlcnR5Q2hvaWNlcyhwcm9wZXR5TmFtZTogc3RyaW5nKTogQXJyYXk8YW55PiB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gU3VydmV5Lkpzb25PYmplY3QubWV0YURhdGEuZ2V0UHJvcGVydGllcyhcIm1hdHJpeGRyb3Bkb3duY29sdW1uXCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2ldLm5hbWUgPT0gcHJvcGV0eU5hbWUpIHJldHVybiBwcm9wZXJ0aWVzW2ldLmNob2ljZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0UHJvcGVydHlBcnJheXMudHNcIiAvPlxyXG5cclxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5UHJvcGVydHlIdG1sIGV4dGVuZHMgU3VydmV5UHJvcGVydHlBcnJheSB7XHJcbiAgICAgICAgcHJpdmF0ZSBrb1ZhbHVlOiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uQXBwbHlDbGljazogYW55O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb25WYWx1ZUNoYW5nZWQ6IFN1cnZleVByb3BlcnR5VmFsdWVDaGFuZ2VkQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgc3VwZXIob25WYWx1ZUNoYW5nZWQpO1xyXG4gICAgICAgICAgICB0aGlzLmtvVmFsdWUgPSBrby5vYnNlcnZhYmxlKCk7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgc2VsZi5vbkFwcGx5Q2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYuQXBwbHkoKTsgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCB2YWx1ZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5rb1ZhbHVlKCk7IH1cclxuICAgICAgICBwdWJsaWMgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhpcy5rb1ZhbHVlKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIEFwcGx5KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vblZhbHVlQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblZhbHVlQ2hhbmdlZCh0aGlzLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0UHJvcGVydHlJdGVtVmFsdWVzLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdFByb3BlcnR5VHJpZ2dlcnMudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0UHJvcGVydHlWYWxpZGF0b3JzLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdFByb3BlcnR5VGV4dEl0ZW1zLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdFByb3BlcnR5TWF0cml4RHJvcGRvd25Db2x1bW5zLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdFByb3BlcnR5SHRtbC50c1wiIC8+XHJcblxyXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuXHJcbiAgICBleHBvcnQgZGVjbGFyZSB0eXBlIFN1cnZleU9uUHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sgPSAocHJvcGVydHk6IFN1cnZleU9iamVjdFByb3BlcnR5LCBuZXdWYWx1ZTogYW55KSA9PiB2b2lkO1xyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlPYmplY3RQcm9wZXJ0eSB7XHJcbiAgICAgICAgcHJpdmF0ZSBvYmplY3RWYWx1ZTogYW55O1xyXG4gICAgICAgIHByaXZhdGUgaXNWYWx1ZVVwZGF0aW5nOiBib29sZWFuO1xyXG4gICAgICAgIHB1YmxpYyBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgcHVibGljIGRpc3BsYXlOYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgcHVibGljIHRpdGxlOiBzdHJpbmc7XHJcbiAgICAgICAgcHVibGljIGtvVmFsdWU6IGFueTtcclxuICAgICAgICBwdWJsaWMga29UZXh0OiBhbnk7XHJcbiAgICAgICAgcHVibGljIGFycmF5RWRpdG9yOiBTdXJ2ZXlQcm9wZXJ0eUFycmF5O1xyXG4gICAgICAgIHB1YmxpYyBtb2RhbE5hbWU6IHN0cmluZzsgXHJcbiAgICAgICAgcHVibGljIG1vZGFsTmFtZVRhcmdldDogc3RyaW5nO1xyXG4gICAgICAgIHB1YmxpYyBrb0lzRGVmYXVsdDogYW55O1xyXG4gICAgICAgIHB1YmxpYyBlZGl0b3JUeXBlOiBzdHJpbmc7XHJcbiAgICAgICAgcHVibGljIGJhc2VFZGl0b3JUeXBlOiBzdHJpbmc7XHJcbiAgICAgICAgcHVibGljIGNob2ljZXM6IEFycmF5PGFueT47XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBwcm9wZXJ0eTogU3VydmV5Lkpzb25PYmplY3RQcm9wZXJ0eSwgb25Qcm9wZXJ0eUNoYW5nZWQ6IFN1cnZleU9uUHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sgPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IHRoaXMucHJvcGVydHkubmFtZTtcclxuICAgICAgICAgICAgdGhpcy5rb1ZhbHVlID0ga28ub2JzZXJ2YWJsZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRvclR5cGUgPSBwcm9wZXJ0eS50eXBlO1xyXG4gICAgICAgICAgICB0aGlzLmNob2ljZXMgPSBwcm9wZXJ0eS5jaG9pY2VzO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jaG9pY2VzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yVHlwZSA9IFwiZHJvcGRvd25cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuYXJyYXlFZGl0b3IgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgb25JdGVtQ2hhbmdlZCA9IGZ1bmN0aW9uIChuZXdWYWx1ZTogYW55KSB7IHNlbGYua29WYWx1ZShuZXdWYWx1ZSk7IH07XHJcbiAgICAgICAgICAgIHRoaXMubW9kYWxOYW1lID0gXCJtb2RlbEVkaXRvclwiICsgdGhpcy5lZGl0b3JUeXBlICsgdGhpcy5uYW1lO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGFsTmFtZVRhcmdldCA9IFwiI1wiICsgdGhpcy5tb2RhbE5hbWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRvclR5cGUgPT0gXCJpdGVtdmFsdWVzXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXlFZGl0b3IgPSBuZXcgU3VydmV5UHJvcGVydHlJdGVtVmFsdWVzKChuZXdWYWx1ZTogYW55KSA9PiB7IG9uSXRlbUNoYW5nZWQobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JUeXBlID09IFwidHJpZ2dlcnNcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcnJheUVkaXRvciA9IG5ldyBTdXJ2ZXlQcm9wZXJ0eVRyaWdnZXJzKChuZXdWYWx1ZTogYW55KSA9PiB7IG9uSXRlbUNoYW5nZWQobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JUeXBlID09IFwidmFsaWRhdG9yc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFycmF5RWRpdG9yID0gbmV3IFN1cnZleVByb3BlcnR5VmFsaWRhdG9ycygobmV3VmFsdWU6IGFueSkgPT4geyBvbkl0ZW1DaGFuZ2VkKG5ld1ZhbHVlKTsgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdG9yVHlwZSA9PSBcInRleHRpdGVtc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFycmF5RWRpdG9yID0gbmV3IFN1cnZleVByb3BlcnR5VGV4dEl0ZW1zKChuZXdWYWx1ZTogYW55KSA9PiB7IG9uSXRlbUNoYW5nZWQobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0b3JUeXBlID09IFwibWF0cml4ZHJvcGRvd25jb2x1bW5zXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXlFZGl0b3IgPSBuZXcgU3VydmV5UHJvcGVydHlNYXRyaXhEcm9wZG93bkNvbHVtbnMoKG5ld1ZhbHVlOiBhbnkpID0+IHsgb25JdGVtQ2hhbmdlZChuZXdWYWx1ZSk7IH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRvclR5cGUgPT0gXCJodG1sXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXlFZGl0b3IgPSBuZXcgU3VydmV5UHJvcGVydHlIdG1sKChuZXdWYWx1ZTogYW55KSA9PiB7IG9uSXRlbUNoYW5nZWQobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJhc2VFZGl0b3JUeXBlID0gdGhpcy5hcnJheUVkaXRvciAhPSBudWxsID8gXCJhcnJheVwiIDogdGhpcy5lZGl0b3JUeXBlO1xyXG4gICAgICAgICAgICB0aGlzLmtvVmFsdWUuc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub2JqZWN0ID09IG51bGwpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxmLm9iamVjdFtzZWxmLm5hbWVdID09IG5ld1ZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAob25Qcm9wZXJ0eUNoYW5nZWQgIT0gbnVsbCAmJiAhc2VsZi5pc1ZhbHVlVXBkYXRpbmcpIG9uUHJvcGVydHlDaGFuZ2VkKHNlbGYsIG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMua29UZXh0ID0ga28uY29tcHV0ZWQoKCkgPT4geyByZXR1cm4gc2VsZi5nZXRWYWx1ZVRleHQoc2VsZi5rb1ZhbHVlKCkpOyB9KTtcclxuICAgICAgICAgICAgdGhpcy5rb0lzRGVmYXVsdCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYucHJvcGVydHkuaXNEZWZhdWx0VmFsdWUoc2VsZi5rb1ZhbHVlKCkpOyB9KTsgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgb2JqZWN0KCk6IGFueSB7IHJldHVybiB0aGlzLm9iamVjdFZhbHVlOyB9XHJcbiAgICAgICAgcHVibGljIHNldCBvYmplY3QodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmFsdWUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIHVwZGF0ZVZhbHVlKCkge1xyXG4gICAgICAgICAgICB0aGlzLmlzVmFsdWVVcGRhdGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMua29WYWx1ZSh0aGlzLmdldFZhbHVlKCkpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheUVkaXRvcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcnJheUVkaXRvci5vYmplY3QgPSB0aGlzLm9iamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXlFZGl0b3IudGl0bGUoZWRpdG9yTG9jYWxpemF0aW9uLmdldFN0cmluZyhcInBlLmVkaXRQcm9wZXJ0eVwiKVtcImZvcm1hdFwiXSh0aGlzLnByb3BlcnR5Lm5hbWUpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXlFZGl0b3IudmFsdWUgPSB0aGlzLmtvVmFsdWUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmlzVmFsdWVVcGRhdGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgZ2V0VmFsdWUoKTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydHkuaGFzVG9Vc2VHZXRWYWx1ZSkgcmV0dXJuIHRoaXMucHJvcGVydHkuZ2V0VmFsdWUodGhpcy5vYmplY3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RbdGhpcy5uYW1lXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIGdldFZhbHVlVGV4dCh2YWx1ZTogYW55KTogc3RyaW5nIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3JMb2NhbGl6YXRpb24uZ2V0U3RyaW5nKFwicGUuaXRlbXNcIilbXCJmb3JtYXRcIl0odmFsdWUubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0aGlzLmVkaXRvclR5cGUgPT0gXCJodG1sXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdHIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyKDAsIDEwKSArIFwiLi4uXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdFByb3BlcnR5LnRzXCIgLz5cclxuXHJcbm1vZHVsZSBTdXJ2ZXlFZGl0b3Ige1xyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleU9iamVjdEVkaXRvciB7XHJcbiAgICAgICAgcHJpdmF0ZSBzZWxlY3RlZE9iamVjdFZhbHVlOiBhbnk7XHJcbiAgICAgICAgcHVibGljIGtvUHJvcGVydGllczogYW55O1xyXG4gICAgICAgIHB1YmxpYyBrb0FjdGl2ZVByb3BlcnR5OiBhbnk7XHJcbiAgICAgICAgcHVibGljIGtvSGFzT2JqZWN0OiBhbnk7XHJcbiAgICAgICAgcHVibGljIG9uUHJvcGVydHlWYWx1ZUNoYW5nZWQ6IFN1cnZleS5FdmVudDwoc2VuZGVyOiBTdXJ2ZXlPYmplY3RFZGl0b3IsIG9wdGlvbnM6IGFueSkgPT4gYW55LCBhbnk+ID0gbmV3IFN1cnZleS5FdmVudDwoc2VuZGVyOiBTdXJ2ZXlPYmplY3RFZGl0b3IsIG9wdGlvbnM6IGFueSkgPT4gYW55LCBhbnk+KCk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICB0aGlzLmtvUHJvcGVydGllcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtvQWN0aXZlUHJvcGVydHkgPSBrby5vYnNlcnZhYmxlKCk7XHJcbiAgICAgICAgICAgIHRoaXMua29IYXNPYmplY3QgPSBrby5vYnNlcnZhYmxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRPYmplY3QoKTogYW55IHsgcmV0dXJuIHRoaXMuc2VsZWN0ZWRPYmplY3RWYWx1ZTsgfVxyXG4gICAgICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWRPYmplY3QodmFsdWU6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZE9iamVjdFZhbHVlID09IHZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMua29IYXNPYmplY3QodmFsdWUgIT0gbnVsbCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnRpZXMoKTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVQcm9wZXJ0aWVzT2JqZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXRQcm9wZXJ0eUVkaXRvcihuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSB0aGlzLmtvUHJvcGVydGllcygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2ldLm5hbWUgPT0gbmFtZSkgcmV0dXJuIHByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBjaGFuZ2VBY3RpdmVQcm9wZXJ0eShwcm9wZXJ0eTogU3VydmV5T2JqZWN0UHJvcGVydHkpIHtcclxuICAgICAgICAgICAgdGhpcy5rb0FjdGl2ZVByb3BlcnR5KHByb3BlcnR5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIE9iamVjdENoYW5nZWQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydGllc09iamVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgdXBkYXRlUHJvcGVydGllcygpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkT2JqZWN0IHx8ICF0aGlzLnNlbGVjdGVkT2JqZWN0LmdldFR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMua29Qcm9wZXJ0aWVzKFtdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMua29BY3RpdmVQcm9wZXJ0eShudWxsKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IFN1cnZleS5Kc29uT2JqZWN0Lm1ldGFEYXRhLmdldFByb3BlcnRpZXModGhpcy5zZWxlY3RlZE9iamVjdC5nZXRUeXBlKCkpO1xyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChhLm5hbWUgPT0gYi5uYW1lKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIGlmIChhLm5hbWUgPiBiLm5hbWUpIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdmFyIG9iamVjdFByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgcHJvcEV2ZW50ID0gKHByb3BlcnR5OiBTdXJ2ZXlPYmplY3RQcm9wZXJ0eSwgbmV3VmFsdWU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vblByb3BlcnR5VmFsdWVDaGFuZ2VkLmZpcmUodGhpcywgeyBwcm9wZXJ0eTogcHJvcGVydHkucHJvcGVydHksIG9iamVjdDogcHJvcGVydHkub2JqZWN0LCBuZXdWYWx1ZTogbmV3VmFsdWUgfSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhblNob3dQcm9wZXJ0eShwcm9wZXJ0aWVzW2ldKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0UHJvcGVydHkgPSBuZXcgU3VydmV5T2JqZWN0UHJvcGVydHkocHJvcGVydGllc1tpXSwgcHJvcEV2ZW50KTtcclxuICAgICAgICAgICAgICAgIHZhciBsb2NOYW1lID0gdGhpcy5zZWxlY3RlZE9iamVjdC5nZXRUeXBlKCkgKyAnXycgKyBwcm9wZXJ0aWVzW2ldLm5hbWU7XHJcbiAgICAgICAgICAgICAgICBvYmplY3RQcm9wZXJ0eS5kaXNwbGF5TmFtZSA9IGVkaXRvckxvY2FsaXphdGlvbi5nZXRQcm9wZXJ0eU5hbWUobG9jTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGl0bGUgPSBlZGl0b3JMb2NhbGl6YXRpb24uZ2V0UHJvcGVydHlUaXRsZShsb2NOYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGl0bGUpIHRpdGxlID0gb2JqZWN0UHJvcGVydHkuZGlzcGxheU5hbWU7XHJcbiAgICAgICAgICAgICAgICBvYmplY3RQcm9wZXJ0eS50aXRsZSA9IHRpdGxlO1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllcy5wdXNoKG9iamVjdFByb3BlcnR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmtvUHJvcGVydGllcyhvYmplY3RQcm9wZXJ0aWVzKTtcclxuICAgICAgICAgICAgdGhpcy5rb0FjdGl2ZVByb3BlcnR5KHRoaXMuZ2V0UHJvcGVydHlFZGl0b3IoXCJuYW1lXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIGNhblNob3dQcm9wZXJ0eShwcm9wZXJ0eTogU3VydmV5Lkpzb25PYmplY3RQcm9wZXJ0eSk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHByb3BlcnR5Lm5hbWU7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09ICdxdWVzdGlvbnMnIHx8IG5hbWUgPT0gJ3BhZ2VzJykgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIHVwZGF0ZVByb3BlcnRpZXNPYmplY3QoKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gdGhpcy5rb1Byb3BlcnRpZXMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW2ldLm9iamVjdCA9IHRoaXMuc2VsZWN0ZWRPYmplY3Q7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxuXHJcbm1vZHVsZSBTdXJ2ZXlFZGl0b3Ige1xyXG4gICAgZXhwb3J0IGRlY2xhcmUgdHlwZSBTdXJ2ZXlBZGROZXdQYWdlQ2FsbGJhY2sgPSAoKSA9PiB2b2lkO1xyXG4gICAgZXhwb3J0IGRlY2xhcmUgdHlwZSBTdXJ2ZXlTZWxlY3RQYWdlQ2FsbGJhY2sgPSAocGFnZTogU3VydmV5LlBhZ2UpID0+IHZvaWQ7XHJcbiAgICBleHBvcnQgZGVjbGFyZSB0eXBlIFN1cnZleU1vdmVQYWdlQ2FsbGJhY2sgPSAoaW5kZXhGcm9tOiBudW1iZXIsIGluZGV4VG86IG51bWJlcikgPT4gdm9pZDtcclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlQYWdlc0VkaXRvciB7XHJcbiAgICAgICAgc3VydmV5VmFsdWU6IFN1cnZleS5TdXJ2ZXk7XHJcbiAgICAgICAga29QYWdlczogYW55O1xyXG4gICAgICAgIGtvSXNWYWxpZDogYW55O1xyXG4gICAgICAgIHNlbGVjdFBhZ2VDbGljazogYW55O1xyXG4gICAgICAgIG9uQWRkTmV3UGFnZUNhbGxiYWNrOiBTdXJ2ZXlBZGROZXdQYWdlQ2FsbGJhY2s7XHJcbiAgICAgICAgb25TZWxlY3RQYWdlQ2FsbGJhY2s6IFN1cnZleVNlbGVjdFBhZ2VDYWxsYmFjaztcclxuICAgICAgICBvbkRlbGV0ZVBhZ2VDYWxsYmFjazogU3VydmV5U2VsZWN0UGFnZUNhbGxiYWNrO1xyXG4gICAgICAgIG9uTW92ZVBhZ2VDYWxsYmFjazogU3VydmV5TW92ZVBhZ2VDYWxsYmFjaztcclxuICAgICAgICBkcmFnZ2luZ1BhZ2U6IGFueSA9IG51bGw7XHJcbiAgICAgICAgZHJhZ1N0YXJ0OiBhbnk7IGRyYWdPdmVyOiBhbnk7IGRyYWdFbmQ6IGFueTsgZHJhZ0Ryb3A6IGFueTsga2V5RG93bjogYW55O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihvbkFkZE5ld1BhZ2VDYWxsYmFjazogU3VydmV5QWRkTmV3UGFnZUNhbGxiYWNrID0gbnVsbCwgb25TZWxlY3RQYWdlQ2FsbGJhY2s6IFN1cnZleVNlbGVjdFBhZ2VDYWxsYmFjayA9IG51bGwsXHJcbiAgICAgICAgICAgIG9uTW92ZVBhZ2VDYWxsYmFjazogU3VydmV5TW92ZVBhZ2VDYWxsYmFjayA9IG51bGwsIG9uRGVsZXRlUGFnZUNhbGxiYWNrOiBTdXJ2ZXlTZWxlY3RQYWdlQ2FsbGJhY2sgPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMua29QYWdlcyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtvSXNWYWxpZCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLm9uQWRkTmV3UGFnZUNhbGxiYWNrID0gb25BZGROZXdQYWdlQ2FsbGJhY2s7XHJcbiAgICAgICAgICAgIHRoaXMub25TZWxlY3RQYWdlQ2FsbGJhY2sgPSBvblNlbGVjdFBhZ2VDYWxsYmFjaztcclxuICAgICAgICAgICAgdGhpcy5vbk1vdmVQYWdlQ2FsbGJhY2sgPSBvbk1vdmVQYWdlQ2FsbGJhY2s7XHJcbiAgICAgICAgICAgIHRoaXMub25EZWxldGVQYWdlQ2FsbGJhY2sgPSBvbkRlbGV0ZVBhZ2VDYWxsYmFjaztcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdFBhZ2VDbGljayA9IGZ1bmN0aW9uKHBhZ2VJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblNlbGVjdFBhZ2VDYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub25TZWxlY3RQYWdlQ2FsbGJhY2socGFnZUl0ZW0ucGFnZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rZXlEb3duID0gZnVuY3Rpb24gKGVsOiBhbnksIGU6IEtleWJvYXJkRXZlbnQpIHsgc2VsZi5vbktleURvd24oZWwsIGUpOyB9XHJcbiAgICAgICAgICAgIHRoaXMuZHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGVsOiBhbnkpIHsgc2VsZi5kcmFnZ2luZ1BhZ2UgPSBlbDsgfTtcclxuICAgICAgICAgICAgdGhpcy5kcmFnT3ZlciA9IGZ1bmN0aW9uIChlbDogYW55KSB7ICB9O1xyXG4gICAgICAgICAgICB0aGlzLmRyYWdFbmQgPSBmdW5jdGlvbiAoKSB7IHNlbGYuZHJhZ2dpbmdQYWdlID0gbnVsbDsgfTtcclxuICAgICAgICAgICAgdGhpcy5kcmFnRHJvcCA9IGZ1bmN0aW9uIChlbDogYW55KSB7IHNlbGYubW92ZURyYWdnaW5nUGFnZVRvKGVsKTsgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCBzdXJ2ZXkoKTogU3VydmV5LlN1cnZleSB7IHJldHVybiB0aGlzLnN1cnZleVZhbHVlOyB9XHJcbiAgICAgICAgcHVibGljIHNldCBzdXJ2ZXkodmFsdWU6IFN1cnZleS5TdXJ2ZXkpIHtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLmtvSXNWYWxpZCh0aGlzLnN1cnZleVZhbHVlICE9IG51bGwpO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBzZXRTZWxlY3RlZFBhZ2UocGFnZTogU3VydmV5LlBhZ2UpIHtcclxuICAgICAgICAgICAgdmFyIHBhZ2VzID0gdGhpcy5rb1BhZ2VzKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBhZ2VzW2ldLmtvU2VsZWN0ZWQocGFnZXNbaV0ucGFnZSA9PSBwYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgYWRkTmV3UGFnZUNsaWNrKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vbkFkZE5ld1BhZ2VDYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkFkZE5ld1BhZ2VDYWxsYmFjaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyByZW1vdmVQYWdlKHBhZ2U6IFN1cnZleS5QYWdlKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0SW5kZXhCeVBhZ2UocGFnZSk7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmtvUGFnZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgY2hhbmdlTmFtZShwYWdlOiBTdXJ2ZXkuUGFnZSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldEluZGV4QnlQYWdlKHBhZ2UpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rb1BhZ2VzKClbaW5kZXhdLnRpdGxlKFN1cnZleUhlbHBlci5nZXRPYmplY3ROYW1lKHBhZ2UpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgZ2V0SW5kZXhCeVBhZ2UocGFnZTogU3VydmV5LlBhZ2UpOiBudW1iZXIge1xyXG4gICAgICAgICAgICB2YXIgcGFnZXMgPSB0aGlzLmtvUGFnZXMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhZ2VzW2ldLnBhZ2UgPT0gcGFnZSkgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgb25LZXlEb3duKGVsOiBhbnksIGU6IEtleWJvYXJkRXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMua29QYWdlcygpLmxlbmd0aCA8PSAxKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBwYWdlcyA9IHRoaXMua29QYWdlcygpO1xyXG4gICAgICAgICAgICB2YXIgcGFnZUluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChwYWdlc1tpXS5wYWdlICYmIHBhZ2VzW2ldLmtvU2VsZWN0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHBhZ2VJbmRleCA8IDApIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSA0NiAmJiB0aGlzLm9uRGVsZXRlUGFnZUNhbGxiYWNrKSB0aGlzLm9uRGVsZXRlUGFnZUNhbGxiYWNrKGVsLnBhZ2UpO1xyXG4gICAgICAgICAgICBpZiAoKGUua2V5Q29kZSA9PSAzNyB8fCBlLmtleUNvZGUgPT0gMzkpICYmIHRoaXMub25TZWxlY3RQYWdlQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHBhZ2VJbmRleCArPSAoZS5rZXlDb2RlID09IDM3ID8gLTEgOiAxKTtcclxuICAgICAgICAgICAgICAgIGlmIChwYWdlSW5kZXggPCAwKSBwYWdlSW5kZXggPSBwYWdlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhZ2VJbmRleCA+PSBwYWdlcy5sZW5ndGgpIHBhZ2VJbmRleCA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IHBhZ2VzW3BhZ2VJbmRleF0ucGFnZTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25TZWxlY3RQYWdlQ2FsbGJhY2socGFnZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFNlbGVjdGVkUGFnZShwYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcm90ZWN0ZWQgdXBkYXRlUGFnZXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleVZhbHVlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMua29QYWdlcyhbXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHBhZ2VzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdXJ2ZXlWYWx1ZS5wYWdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSB0aGlzLnN1cnZleVZhbHVlLnBhZ2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgcGFnZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGtvLm9ic2VydmFibGUoU3VydmV5SGVscGVyLmdldE9iamVjdE5hbWUocGFnZSkpLCBwYWdlOiBwYWdlLCBrb1NlbGVjdGVkOiBrby5vYnNlcnZhYmxlKGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb1BhZ2VzKHBhZ2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBtb3ZlRHJhZ2dpbmdQYWdlVG8odG9QYWdlOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKHRvUGFnZSA9PSBudWxsIHx8IHRvUGFnZSA9PSB0aGlzLmRyYWdnaW5nUGFnZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZ1BhZ2UgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRyYWdnaW5nUGFnZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMua29QYWdlcygpLmluZGV4T2YodGhpcy5kcmFnZ2luZ1BhZ2UpO1xyXG4gICAgICAgICAgICB2YXIgaW5kZXhUbyA9IHRoaXMua29QYWdlcygpLmluZGV4T2YodG9QYWdlKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMub25Nb3ZlUGFnZUNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTW92ZVBhZ2VDYWxsYmFjayhpbmRleCwgaW5kZXhUbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxubW9kdWxlIFN1cnZleUVkaXRvciB7XHJcbiAgICBjbGFzcyBUZXh0UGFyc2VyUHJvcGVyeSB7XHJcbiAgICAgICAgaXNGb3VuZDogYm9vbGVhbjtcclxuICAgICAgICBwcm9wZXJ0aWVzQ291bnQ6IG51bWJlcjtcclxuICAgICAgICBzdGFydDogbnVtYmVyO1xyXG4gICAgICAgIGVuZDogbnVtYmVyO1xyXG4gICAgICAgIHZhbHVlU3RhcnQ6IG51bWJlcjtcclxuICAgICAgICB2YWx1ZUVuZDogbnVtYmVyO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlUZXh0V29ya2VyIHtcclxuICAgICAgICBwdWJsaWMgc3RhdGljIG5ld0xpbmVDaGFyOiBzdHJpbmc7XHJcbiAgICAgICAgcHVibGljIGVycm9yczogQXJyYXk8YW55PjtcclxuICAgICAgICBwcml2YXRlIHN1cnZleVZhbHVlOiBTdXJ2ZXkuU3VydmV5O1xyXG4gICAgICAgIHByaXZhdGUganNvblZhbHVlOiBhbnk7XHJcbiAgICAgICAgcHJpdmF0ZSBzdXJ2ZXlPYmplY3RzOiBBcnJheTxhbnk+O1xyXG4gICAgICAgIHByaXZhdGUgaXNTdXJ2ZXlBc1BhZ2U6IGJvb2xlYW47XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnRleHQgfHwgdGhpcy50ZXh0LnRyaW0oKSA9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRleHQgPSBcInt9XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgc3VydmV5KCk6IFN1cnZleS5TdXJ2ZXkgeyByZXR1cm4gdGhpcy5zdXJ2ZXlWYWx1ZTsgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgaXNKc29uQ29ycmVjdCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuc3VydmV5VmFsdWUgIT0gbnVsbDsgfVxyXG4gICAgICAgIHByb3RlY3RlZCBwcm9jZXNzKCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qc29uVmFsdWUgPSBuZXcgU3VydmV5SlNPTjUoMSkucGFyc2UodGhpcy50ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goeyBwb3M6IHsgc3RhcnQ6IGVycm9yLmF0LCBlbmQ6IC0xIH0sIHRleHQ6IGVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuanNvblZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlSnNvblBvc2l0aW9ucyh0aGlzLmpzb25WYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlID0gbmV3IFN1cnZleS5TdXJ2ZXkodGhpcy5qc29uVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3VydmV5VmFsdWUuanNvbkVycm9ycyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1cnZleVZhbHVlLmpzb25FcnJvcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yID0gdGhpcy5zdXJ2ZXlWYWx1ZS5qc29uRXJyb3JzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKHsgcG9zOiB7IHN0YXJ0OiBlcnJvci5hdCwgZW5kOiAtMSB9LCB0ZXh0OiBlcnJvci5nZXRGdWxsRGVzY3JpcHRpb24oKSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlPYmplY3RzID0gdGhpcy5jcmVhdGVTdXJ2ZXlPYmplY3RzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RWRpdG9yUG9zaXRpb25CeUNoYXJ0QXQodGhpcy5zdXJ2ZXlPYmplY3RzKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JQb3NpdGlvbkJ5Q2hhcnRBdCh0aGlzLmVycm9ycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgdXBkYXRlSnNvblBvc2l0aW9ucyhqc29uT2JqOiBhbnkpIHtcclxuICAgICAgICAgICAganNvbk9ialtcInBvc1wiXVtcInNlbGZcIl0gPSBqc29uT2JqO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4ganNvbk9iaikge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IGpzb25PYmpba2V5XTtcclxuICAgICAgICAgICAgICAgIGlmIChvYmogJiYgb2JqW1wicG9zXCJdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbk9ialtcInBvc1wiXVtrZXldID0gb2JqW1wicG9zXCJdO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlSnNvblBvc2l0aW9ucyhvYmopO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgY3JlYXRlU3VydmV5T2JqZWN0cygpOiBBcnJheTxhbnk+IHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zdXJ2ZXlWYWx1ZSA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB0aGlzLmlzU3VydmV5QXNQYWdlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdXJ2ZXlWYWx1ZS5wYWdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSB0aGlzLnN1cnZleVZhbHVlLnBhZ2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMCAmJiAhcGFnZVtcInBvc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VbXCJwb3NcIl0gPSB0aGlzLnN1cnZleVZhbHVlW1wicG9zXCJdO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTdXJ2ZXlBc1BhZ2UgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFnZSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhZ2UucXVlc3Rpb25zLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFnZS5xdWVzdGlvbnNbal0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgc2V0RWRpdG9yUG9zaXRpb25CeUNoYXJ0QXQob2JqZWN0czogYW55W10pIHtcclxuICAgICAgICAgICAgaWYgKG9iamVjdHMgPT0gbnVsbCB8fCBvYmplY3RzLmxlbmd0aCA9PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHsgcm93OiAwLCBjb2x1bW46IDAgfTtcclxuICAgICAgICAgICAgdmFyIGF0T2JqZWN0c0FycmF5ID0gdGhpcy5nZXRBdEFycmF5KG9iamVjdHMpO1xyXG4gICAgICAgICAgICB2YXIgc3RhcnRBdDogbnVtYmVyID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdE9iamVjdHNBcnJheS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0ID0gYXRPYmplY3RzQXJyYXlbaV0uYXQ7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMuZ2V0UG9zdGlvbkJ5Q2hhcnRBdChwb3NpdGlvbiwgc3RhcnRBdCwgYXQpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IGF0T2JqZWN0c0FycmF5W2ldLm9iajtcclxuICAgICAgICAgICAgICAgIGlmICghb2JqLnBvc2l0aW9uKSBvYmoucG9zaXRpb24gPSB7fTtcclxuICAgICAgICAgICAgICAgIGlmIChhdCA9PSBvYmoucG9zLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLnBvc2l0aW9uLnN0YXJ0ID0gcG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdCA9PSBvYmoucG9zLmVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoucG9zaXRpb24uZW5kID0gcG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RhcnRBdCA9IGF0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0UG9zdGlvbkJ5Q2hhcnRBdChzdGFydFBvc2l0aW9uOiBBY2VBamF4LlBvc2l0aW9uLCBzdGFydEF0OiBudW1iZXIsIGF0OiBudW1iZXIpOiBhbnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0geyByb3c6IHN0YXJ0UG9zaXRpb24ucm93LCBjb2x1bW46IHN0YXJ0UG9zaXRpb24uY29sdW1uIH07XHJcbiAgICAgICAgICAgIHZhciBjdXJDaGFyID0gc3RhcnRBdDtcclxuICAgICAgICAgICAgd2hpbGUgKGN1ckNoYXIgPCBhdCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGV4dC5jaGFyQXQoY3VyQ2hhcikgPT0gU3VydmV5VGV4dFdvcmtlci5uZXdMaW5lQ2hhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yb3crKztcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY29sdW1uID0gMDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmNvbHVtbisrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VyQ2hhcisrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0QXRBcnJheShvYmplY3RzOiBhbnlbXSk6IGFueVtdIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBvYmplY3RzW2ldO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IG9iai5wb3M7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBvcykgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IGF0OiBwb3Muc3RhcnQsIG9iajogb2JqIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvcy5lbmQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyBhdDogcG9zLmVuZCwgb2JqOiBvYmogfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5zb3J0KChlbDEsIGVsMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsMS5hdCA+IGVsMi5hdCkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWwxLmF0IDwgZWwyLmF0KSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLyohXG4qIHN1cnZleWpzIEVkaXRvciB2MC45LjEwXG4qIChjKSBBbmRyZXcgVGVsbm92IC0gaHR0cDovL3N1cnZleWpzLm9yZy9idWlsZGVyL1xuKiBHaXRodWIgLSBodHRwczovL2dpdGh1Yi5jb20vYW5kcmV3dGVsbm92L3N1cnZleS5qcy5lZGl0b3JcbiovXG5cbm1vZHVsZSBTdXJ2ZXlFZGl0b3Ige1xyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleUVtYmVkaW5nV2luZG93IHtcclxuICAgICAgICBwcml2YXRlIGpzb25WYWx1ZTogYW55O1xyXG4gICAgICAgIHByaXZhdGUgc3VydmV5RW1iZWRpbmdIZWFkOiBBY2VBamF4LkVkaXRvcjtcclxuICAgICAgICBwcml2YXRlIHN1cnZleUVtYmVkaW5nSmF2YTogQWNlQWpheC5FZGl0b3I7XHJcbiAgICAgICAgcHVibGljIHN1cnZleUlkOiBzdHJpbmcgPSBudWxsO1xyXG4gICAgICAgIHB1YmxpYyBzdXJ2ZXlQb3N0SWQ6IHN0cmluZyA9IG51bGw7XHJcbiAgICAgICAgcHVibGljIGdlbmVyYXRlVmFsaWRKU09OOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAga29TaG93QXNXaW5kb3c6IGFueTtcclxuICAgICAgICBrb1NjcmlwdFVzaW5nOiBhbnk7XHJcbiAgICAgICAga29IYXNJZHM6IGFueTtcclxuICAgICAgICBrb0xvYWRTdXJ2ZXk6IGFueTtcclxuICAgICAgICBrb0xpYnJhcnlWZXJzaW9uOiBhbnk7XHJcbiAgICAgICAga29WaXNpYmxlSHRtbDogYW55O1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMua29MaWJyYXJ5VmVyc2lvbiA9IGtvLm9ic2VydmFibGUoXCJrbm9ja291dFwiKTtcclxuICAgICAgICAgICAgdGhpcy5rb1Nob3dBc1dpbmRvdyA9IGtvLm9ic2VydmFibGUoXCJwYWdlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2NyaXB0VXNpbmcgPSBrby5vYnNlcnZhYmxlKFwiYm9vdHN0cmFwXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmtvSGFzSWRzID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29Mb2FkU3VydmV5ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29WaXNpYmxlSHRtbCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2VsZi5rb0xpYnJhcnlWZXJzaW9uKCkgPT0gXCJyZWFjdFwiIHx8IHNlbGYua29TaG93QXNXaW5kb3coKSA9PVwicGFnZVwiOyB9KTtcclxuICAgICAgICAgICAgdGhpcy5rb0xpYnJhcnlWZXJzaW9uLnN1YnNjcmliZShmdW5jdGlvbiAobmV3VmFsdWUpIHsgc2VsZi5zZXRIZWFkVGV4dCgpOyBzZWxmLnN1cnZleUVtYmVkaW5nSmF2YS5zZXRWYWx1ZShzZWxmLmdldEphdmFUZXh0KCkpOyB9KTtcclxuICAgICAgICAgICAgdGhpcy5rb1Nob3dBc1dpbmRvdy5zdWJzY3JpYmUoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7IHNlbGYuc3VydmV5RW1iZWRpbmdKYXZhLnNldFZhbHVlKHNlbGYuZ2V0SmF2YVRleHQoKSk7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2NyaXB0VXNpbmcuc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkgeyBzZWxmLnNldEhlYWRUZXh0KCk7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLmtvTG9hZFN1cnZleS5zdWJzY3JpYmUoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7IHNlbGYuc3VydmV5RW1iZWRpbmdKYXZhLnNldFZhbHVlKHNlbGYuZ2V0SmF2YVRleHQoKSk7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nSGVhZCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQganNvbigpOiBhbnkgeyByZXR1cm4gdGhpcy5qc29uVmFsdWU7IH1cclxuICAgICAgICBwdWJsaWMgc2V0IGpzb24odmFsdWU6IGFueSkgeyB0aGlzLmpzb25WYWx1ZSA9IHZhbHVlOyB9XHJcbiAgICAgICAgcHVibGljIHNob3coKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleUVtYmVkaW5nSGVhZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nSGVhZCA9IHRoaXMuY3JlYXRlRWRpdG9yKFwic3VydmV5RW1iZWRpbmdIZWFkXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkVGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJvZHlFZGl0b3IgPSB0aGlzLmNyZWF0ZUVkaXRvcihcInN1cnZleUVtYmVkaW5nQm9keVwiKTtcclxuICAgICAgICAgICAgICAgIGJvZHlFZGl0b3Iuc2V0VmFsdWUoXCI8ZGl2IGlkPSBcXFwibXlTdXJ2ZXlKU05hbWVcXFwiID48L2Rpdj5cIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nSmF2YSA9IHRoaXMuY3JlYXRlRWRpdG9yKFwic3VydmV5RW1iZWRpbmdKYXZhXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMua29IYXNJZHModGhpcy5zdXJ2ZXlJZCAmJiB0aGlzLnN1cnZleVBvc3RJZCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5RW1iZWRpbmdKYXZhLnNldFZhbHVlKHRoaXMuZ2V0SmF2YVRleHQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgc2V0SGVhZFRleHQoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmtvTGlicmFyeVZlcnNpb24oKSA9PSBcImtub2Nrb3V0XCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrbm9ja291dFN0ciA9IFwiPHNjcmlwdCBzcmM9XFxcImh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2tub2Nrb3V0LzMuMy4wL2tub2Nrb3V0LW1pbi5qc1xcXCIgPjwvc2NyaXB0PlxcblwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMua29TY3JpcHRVc2luZygpID09IFwiYm9vdHN0cmFwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nSGVhZC5zZXRWYWx1ZShrbm9ja291dFN0ciArIFwiPHNjcmlwdCBzcmM9XFxcImpzL3N1cnZleS5ib290c3RyYXAubWluLmpzXFxcIj48L3NjcmlwdD5cIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3VydmV5RW1iZWRpbmdIZWFkLnNldFZhbHVlKGtub2Nrb3V0U3RyICsgXCI8c2NyaXB0IHNyYz1cXFwianMvc3VydmV5Lm1pbi5qc1xcXCI+PC9zY3JpcHQ+XFxuPGxpbmsgaHJlZj1cXFwiY3NzL3N1cnZleS5jc3NcXFwiIHR5cGU9XFxcInRleHQvY3NzXFxcIiByZWw9XFxcInN0eWxlc2hlZXRcXFwiIC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtub2Nrb3V0U3RyID0gXCI8c2NyaXB0IHNyYz1cXFwiaHR0cHM6Ly9mYi5tZS9yZWFjdC0wLjE0LjguanNcXFwiPjwvc2NyaXB0PlxcbjxzY3JpcHQgc3JjPSBcXFwiaHR0cHM6Ly9mYi5tZS9yZWFjdC1kb20tMC4xNC44LmpzXFxcIj48L3NjcmlwdD5cXG48c2NyaXB0IHNyYz1cXFwiaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvYmFiZWwtY29yZS81LjguMjMvYnJvd3Nlci5taW4uanNcXFwiPjwvc2NyaXB0PlxcblwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMua29TY3JpcHRVc2luZygpID09IFwiYm9vdHN0cmFwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nSGVhZC5zZXRWYWx1ZShrbm9ja291dFN0ciArIFwiPHNjcmlwdCBzcmM9XFxcImpzL3N1cnZleS5yZWFjdC5ib290c3RyYXAubWluLmpzXFxcIj48L3NjcmlwdD5cIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3VydmV5RW1iZWRpbmdIZWFkLnNldFZhbHVlKGtub2Nrb3V0U3RyICsgXCI8c2NyaXB0IHNyYz1cXFwianMvc3VydmV5LnJlYWN0Lm1pbi5qc1xcXCI+PC9zY3JpcHQ+XFxuPGxpbmsgaHJlZj1cXFwiY3NzL3N1cnZleS5jc3NcXFwiIHR5cGU9XFxcInRleHQvY3NzXFxcIiByZWw9XFxcInN0eWxlc2hlZXRcXFwiIC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgY3JlYXRlRWRpdG9yKGVsZW1lbnROYW1lOiBzdHJpbmcpOiBBY2VBamF4LkVkaXRvciB7XHJcbiAgICAgICAgICAgIHZhciBlZGl0b3IgPSBhY2UuZWRpdChlbGVtZW50TmFtZSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRUaGVtZShcImFjZS90aGVtZS9tb25va2FpXCIpO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2Vzc2lvbi5zZXRNb2RlKFwiYWNlL21vZGUvanNvblwiKTtcclxuICAgICAgICAgICAgZWRpdG9yLnNldFNob3dQcmludE1hcmdpbihmYWxzZSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5yZW5kZXJlci5zZXRTaG93R3V0dGVyKGZhbHNlKTtcclxuICAgICAgICAgICAgZWRpdG9yLnNldFJlYWRPbmx5KHRydWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldEphdmFUZXh0KCk6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIHZhciBpc09uUGFnZSA9IHRoaXMua29TaG93QXNXaW5kb3coKSA9PSBcInBhZ2VcIjtcclxuICAgICAgICAgICAgaWYgKHRoaXMua29MaWJyYXJ5VmVyc2lvbigpID09IFwia25vY2tvdXRcIikgcmV0dXJuIHRoaXMuZ2V0S25vY2tvdXRKYXZhVGV4dChpc09uUGFnZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFJlYWN0SmF2YVRleHQoaXNPblBhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldEtub2Nrb3V0SmF2YVRleHQoaXNPblBhZ2U6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IGlzT25QYWdlID8gXCJ2YXIgc3VydmV5ID0gbmV3IFN1cnZleS5TdXJ2ZXkoXFxuXCIgOiBcInZhciBzdXJ2ZXlXaW5kb3cgPSBuZXcgU3VydmV5LlN1cnZleVdpbmRvdyhcXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSB0aGlzLmdldEpzb25UZXh0KCk7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIpO1xcblwiO1xyXG4gICAgICAgICAgICBpZiAoIWlzT25QYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFwic3VydmV5V2luZG93LlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzYXZlRnVuYyA9IHRoaXMuZ2V0U2F2ZUZ1bmNDb2RlKCk7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCJzdXJ2ZXkub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24gKHMpIHtcXG5cIiArIHNhdmVGdW5jICsgXCJcXG4gfSk7XFxuXCI7XHJcbiAgICAgICAgICAgIGlmIChpc09uUGFnZSkge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcInN1cnZleS5yZW5kZXIoXFxcIm15U3VydmV5SlNOYW1lXFxcIik7XCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiLy9CeSBkZWZhdWx0IFN1cnZleS50aXRsZSBpcyB1c2VkLlxcblwiXHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiLy9zdXJ2ZXlXaW5kb3cudGl0bGUgPSBcXFwiTXkgU3VydmV5IFdpbmRvdyBUaXRsZS5cXFwiO1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcInN1cnZleVdpbmRvdy5zaG93KCk7XCI7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFJlYWN0SmF2YVRleHQoaXNPblBhZ2U6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG4gICAgICAgICAgICB2YXIgc2F2ZUZ1bmMgPSB0aGlzLmdldFNhdmVGdW5jQ29kZSgpO1xyXG4gICAgICAgICAgICB2YXIgc2VuZFJlc3VsdFRleHQgPSBcInZhciBzdXJ2ZXlTZW5kUmVzdWx0ID0gZnVuY3Rpb24gKHMpIHtcXG5cIiArIHNhdmVGdW5jICsgXCJcXG4gfSk7XFxuXCI7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gaXNPblBhZ2UgPyBcIlJlYWN0U3VydmV5XCIgOiBcIlJlYWN0U3VydmV5V2luZG93XCI7XHJcbiAgICAgICAgICAgIHZhciBqc29uVGV4dCA9IFwidmFyIHN1cnZleUpzb24gPSBcIiArIHRoaXMuZ2V0SnNvblRleHQoKSArIFwiXFxuXFxuXCI7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0ID0ganNvblRleHQgKyBzZW5kUmVzdWx0VGV4dCArIFwiUmVhY3RET00ucmVuZGVyKFxcbjxcIiArIG5hbWUgKyBcIiBqc29uPXtzdXJ2ZXlKc29ufSBvbkNvbXBsZXRlPXtzdXJ2ZXlTZW5kUmVzdWx0fSAvPiwgXFxuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFxcXCJteVN1cnZleUpTTmFtZVxcXCIpKTtcIjtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0U2F2ZUZ1bmNDb2RlKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5rb0hhc0lkcygpKSByZXR1cm4gXCJzdXJ2ZXkuc2VuZFJlc3VsdCgnXCIgKyB0aGlzLnN1cnZleVBvc3RJZCArIFwiJyk7XCI7XHJcbiAgICAgICAgICAgIHJldHVybiBcImFsZXJ0KFxcXCJUaGUgcmVzdWx0cyBhcmU6XFxcIiArIEpTT04uc3RyaW5naWZ5KHMuZGF0YSkpO1wiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldEpzb25UZXh0KCk6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmtvSGFzSWRzKCkgJiYgdGhpcy5rb0xvYWRTdXJ2ZXkoKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwieyBzdXJ2ZXlJZDogJ1wiICsgdGhpcy5zdXJ2ZXlJZCArIFwiJ31cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5nZW5lcmF0ZVZhbGlkSlNPTikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuanNvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3VydmV5SlNPTjUoKS5zdHJpbmdpZnkodGhpcy5qc29uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxuICAgIG1vZHVsZSBTdXJ2ZXlFZGl0b3Ige1xyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleVZlcmJzIHtcclxuICAgICAgICBwcml2YXRlIHN1cnZleVZhbHVlOiBTdXJ2ZXkuU3VydmV5O1xyXG4gICAgICAgIHByaXZhdGUgb2JqVmFsdWU6IGFueTtcclxuICAgICAgICBwcml2YXRlIGNob2ljZXNDbGFzc2VzOiBBcnJheTxzdHJpbmc+O1xyXG4gICAgICAgIGtvVmVyYnM6IGFueTtcclxuICAgICAgICBrb0hhc1ZlcmJzOiBhbnk7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIG9uTW9kaWZpZWRDYWxsYmFjazogKCkgPT4gYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMua29WZXJicyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtvSGFzVmVyYnMgPSBrby5vYnNlcnZhYmxlKCk7XHJcbiAgICAgICAgICAgIHZhciBjbGFzc2VzID0gU3VydmV5Lkpzb25PYmplY3QubWV0YURhdGEuZ2V0Q2hpbGRyZW5DbGFzc2VzKFwic2VsZWN0YmFzZVwiLCB0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5jaG9pY2VzQ2xhc3NlcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hvaWNlc0NsYXNzZXMucHVzaChjbGFzc2VzW2ldLm5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgc3VydmV5KCk6IFN1cnZleS5TdXJ2ZXkgeyByZXR1cm4gdGhpcy5zdXJ2ZXlWYWx1ZTsgfVxyXG4gICAgICAgIHB1YmxpYyBzZXQgc3VydmV5KHZhbHVlOiBTdXJ2ZXkuU3VydmV5KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleSA9PSB2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgb2JqKCk6IGFueSB7IHJldHVybiB0aGlzLm9ialZhbHVlIH1cclxuICAgICAgICBwdWJsaWMgc2V0IG9iaih2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9ialZhbHVlID09IHZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMub2JqVmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5idWlsZFZlcmJzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgYnVpbGRWZXJicygpIHtcclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcbiAgICAgICAgICAgIHZhciBvYmpUeXBlID0gU3VydmV5SGVscGVyLmdldE9iamVjdFR5cGUodGhpcy5vYmopO1xyXG4gICAgICAgICAgICBpZiAob2JqVHlwZSA9PSBPYmpUeXBlLlF1ZXN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcXVlc3Rpb24gPSA8U3VydmV5LlF1ZXN0aW9uQmFzZT50aGlzLm9iajtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleS5wYWdlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChuZXcgU3VydmV5VmVyYkNoYW5nZVBhZ2VJdGVtKHRoaXMuc3VydmV5LCBxdWVzdGlvbiwgdGhpcy5vbk1vZGlmaWVkQ2FsbGJhY2spKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNob2ljZXNDbGFzc2VzLmluZGV4T2YocXVlc3Rpb24uZ2V0VHlwZSgpKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChuZXcgU3VydmV5VmVyYkNoYW5nZVR5cGVJdGVtKHRoaXMuc3VydmV5LCBxdWVzdGlvbiwgdGhpcy5vbk1vZGlmaWVkQ2FsbGJhY2spKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmtvVmVyYnMoYXJyYXkpO1xyXG4gICAgICAgICAgICB0aGlzLmtvSGFzVmVyYnMoYXJyYXkubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleVZlcmJJdGVtIHtcclxuICAgICAgICBrb0l0ZW1zOiBhbnk7XHJcbiAgICAgICAga29TZWxlY3RlZEl0ZW06IGFueTtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgc3VydmV5OiBTdXJ2ZXkuU3VydmV5LCBwdWJsaWMgcXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UsIHB1YmxpYyBvbk1vZGlmaWVkQ2FsbGJhY2s6ICgpID0+IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLmtvSXRlbXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKTtcclxuICAgICAgICAgICAgdGhpcy5rb1NlbGVjdGVkSXRlbSA9IGtvLm9ic2VydmFibGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCB0ZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIlwiOyB9XHJcbiAgICB9XHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5VmVyYkNoYW5nZVR5cGVJdGVtIGV4dGVuZHMgU3VydmV5VmVyYkl0ZW0ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBzdXJ2ZXk6IFN1cnZleS5TdXJ2ZXksIHB1YmxpYyBxdWVzdGlvbjogU3VydmV5LlF1ZXN0aW9uQmFzZSwgcHVibGljIG9uTW9kaWZpZWRDYWxsYmFjazogKCkgPT4gYW55KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKHN1cnZleSwgcXVlc3Rpb24sIG9uTW9kaWZpZWRDYWxsYmFjayk7XHJcbiAgICAgICAgICAgIHZhciBjbGFzc2VzID0gU3VydmV5Lkpzb25PYmplY3QubWV0YURhdGEuZ2V0Q2hpbGRyZW5DbGFzc2VzKFwic2VsZWN0YmFzZVwiLCB0cnVlKTtcclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaCh7IHZhbHVlOiBjbGFzc2VzW2ldLm5hbWUsIHRleHQ6IGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcoXCJxdC5cIiArIGNsYXNzZXNbaV0ubmFtZSkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb0l0ZW1zKGFycmF5KTtcclxuICAgICAgICAgICAgdGhpcy5rb1NlbGVjdGVkSXRlbShxdWVzdGlvbi5nZXRUeXBlKCkpO1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMua29TZWxlY3RlZEl0ZW0uc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkgeyBzZWxmLmNoYW5nZVR5cGUobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCB0ZXh0KCk6IHN0cmluZyB7IHJldHVybiBlZGl0b3JMb2NhbGl6YXRpb24uZ2V0U3RyaW5nKFwicGUudmVyYkNoYW5nZVR5cGVcIik7IH1cclxuICAgICAgICBwcml2YXRlIGNoYW5nZVR5cGUocXVlc3Rpb25UeXBlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgaWYgKHF1ZXN0aW9uVHlwZSA9PSB0aGlzLnF1ZXN0aW9uLmdldFR5cGUoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICB2YXIgcGFnZSA9IHRoaXMuc3VydmV5LmdldFBhZ2VCeVF1ZXN0aW9uKHRoaXMucXVlc3Rpb24pO1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYWdlLnF1ZXN0aW9ucy5pbmRleE9mKHRoaXMucXVlc3Rpb24pO1xyXG4gICAgICAgICAgICB2YXIgbmV3UXVlc3Rpb24gPSBTdXJ2ZXkuUXVlc3Rpb25GYWN0b3J5Lkluc3RhbmNlLmNyZWF0ZVF1ZXN0aW9uKHF1ZXN0aW9uVHlwZSwgdGhpcy5xdWVzdGlvbi5uYW1lKTtcclxuICAgICAgICAgICAgdmFyIGpzb25PYmogPSBuZXcgU3VydmV5Lkpzb25PYmplY3QoKTtcclxuICAgICAgICAgICAgdmFyIGpzb24gPSBqc29uT2JqLnRvSnNvbk9iamVjdCh0aGlzLnF1ZXN0aW9uKTtcclxuICAgICAgICAgICAganNvbk9iai50b09iamVjdChqc29uLCBuZXdRdWVzdGlvbik7XHJcbiAgICAgICAgICAgIHBhZ2UucmVtb3ZlUXVlc3Rpb24odGhpcy5xdWVzdGlvbik7XHJcbiAgICAgICAgICAgIHBhZ2UuYWRkUXVlc3Rpb24obmV3UXVlc3Rpb24sIGluZGV4KTtcclxuICAgICAgICAgICAgaWYgKHRoaXMub25Nb2RpZmllZENhbGxiYWNrKSB0aGlzLm9uTW9kaWZpZWRDYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlWZXJiQ2hhbmdlUGFnZUl0ZW0gZXh0ZW5kcyBTdXJ2ZXlWZXJiSXRlbSB7XHJcbiAgICAgICAgcHJpdmF0ZSBwcmV2UGFnZTogU3VydmV5LlBhZ2U7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIHN1cnZleTogU3VydmV5LlN1cnZleSwgcHVibGljIHF1ZXN0aW9uOiBTdXJ2ZXkuUXVlc3Rpb25CYXNlLCBwdWJsaWMgb25Nb2RpZmllZENhbGxiYWNrOiAoKSA9PiBhbnkpIHtcclxuICAgICAgICAgICAgc3VwZXIoc3VydmV5LCBxdWVzdGlvbiwgb25Nb2RpZmllZENhbGxiYWNrKTtcclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdXJ2ZXkucGFnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gdGhpcy5zdXJ2ZXkucGFnZXNbaV07XHJcbiAgICAgICAgICAgICAgICBhcnJheS5wdXNoKHsgdmFsdWU6IHBhZ2UsIHRleHQ6IFN1cnZleUhlbHBlci5nZXRPYmplY3ROYW1lKHBhZ2UpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMua29JdGVtcyhhcnJheSk7XHJcbiAgICAgICAgICAgIHRoaXMucHJldlBhZ2UgPSA8U3VydmV5LlBhZ2U+dGhpcy5zdXJ2ZXkuZ2V0UGFnZUJ5UXVlc3Rpb24ocXVlc3Rpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWRJdGVtKHRoaXMucHJldlBhZ2UpO1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMua29TZWxlY3RlZEl0ZW0uc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkgeyBzZWxmLmNoYW5nZVBhZ2UobmV3VmFsdWUpOyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCB0ZXh0KCk6IHN0cmluZyB7IHJldHVybiBlZGl0b3JMb2NhbGl6YXRpb24uZ2V0U3RyaW5nKFwicGUudmVyYkNoYW5nZVBhZ2VcIik7IH1cclxuICAgICAgICBwcml2YXRlIGNoYW5nZVBhZ2UobmV3UGFnZTogU3VydmV5LlBhZ2UpIHtcclxuICAgICAgICAgICAgaWYgKG5ld1BhZ2UgPT0gbnVsbCB8fCBuZXdQYWdlID09IHRoaXMucHJldlBhZ2UpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5wcmV2UGFnZS5yZW1vdmVRdWVzdGlvbih0aGlzLnF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgbmV3UGFnZS5hZGRRdWVzdGlvbih0aGlzLnF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMub25Nb2RpZmllZENhbGxiYWNrKSB0aGlzLm9uTW9kaWZpZWRDYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlVbmRvUmVkbyB7XHJcbiAgICAgICAgcHJpdmF0ZSBpdGVtczogQXJyYXk8VW5kb1JlZG9JdGVtPjtcclxuICAgICAgICBwcml2YXRlIGluZGV4OiBudW1iZXIgPSAtMTtcclxuICAgICAgICBwdWJsaWMga29DYW5VbmRvOiBhbnk7IGtvQ2FuUmVkbzogYW55O1xyXG4gICAgICAgIHB1YmxpYyBtYXhpbXVtQ291bnQ6IG51bWJlciA9IDEwO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcbiAgICAgICAgICAgIHRoaXMua29DYW5VbmRvID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29DYW5SZWRvID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmtvQ2FuVW5kbyhmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29DYW5SZWRvKGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHNldEN1cnJlbnQoc3VydmV5OiBTdXJ2ZXkuU3VydmV5LCBzZWxlY3RlZE9iak5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IG5ldyBVbmRvUmVkb0l0ZW0oKTtcclxuICAgICAgICAgICAgaXRlbS5zdXJ2ZXlKU09OID0gbmV3IFN1cnZleS5Kc29uT2JqZWN0KCkudG9Kc29uT2JqZWN0KHN1cnZleSk7XHJcbiAgICAgICAgICAgIGl0ZW0uc2VsZWN0ZWRPYmpOYW1lID0gc2VsZWN0ZWRPYmpOYW1lO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuaXRlbXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UodGhpcy5pbmRleCArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVPbGREYXRhKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FuVW5kb1JlZG8oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHVuZG8oKTogVW5kb1JlZG9JdGVtIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmNhblVuZG8pIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb1VuZG9SZWRvKC0xKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHJlZG8oKTogVW5kb1JlZG9JdGVtICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jYW5SZWRvKSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG9VbmRvUmVkbygxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVDYW5VbmRvUmVkbygpIHtcclxuICAgICAgICAgICAgdGhpcy5rb0NhblVuZG8odGhpcy5jYW5VbmRvKTtcclxuICAgICAgICAgICAgdGhpcy5rb0NhblJlZG8odGhpcy5jYW5SZWRvKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBkb1VuZG9SZWRvKGRJbmRleDogbnVtYmVyKTogVW5kb1JlZG9JdGVtIHtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCArPSBkSW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FuVW5kb1JlZG8oKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXggPj0gMCAmJiB0aGlzLmluZGV4IDwgdGhpcy5pdGVtcy5sZW5ndGggPyB0aGlzLml0ZW1zW3RoaXMuaW5kZXhdIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIGdldCBjYW5VbmRvKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleCA+PSAxICYmIHRoaXMuaW5kZXggPCB0aGlzLml0ZW1zLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIGdldCBjYW5SZWRvKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5sZW5ndGggPiAxICYmIHRoaXMuaW5kZXggPCB0aGlzLml0ZW1zLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgcmVtb3ZlT2xkRGF0YSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXRlbXMubGVuZ3RoIC0gMSA8IHRoaXMubWF4aW11bUNvdW50KSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMuc3BsaWNlKDAsIHRoaXMuaXRlbXMubGVuZ3RoIC0gdGhpcy5tYXhpbXVtQ291bnQgLSAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBleHBvcnQgY2xhc3MgVW5kb1JlZG9JdGVtIHtcclxuICAgICAgICBzdXJ2ZXlKU09OOiBhbnk7XHJcbiAgICAgICAgc2VsZWN0ZWRPYmpOYW1lOiBzdHJpbmc7XHJcbiAgICB9XHJcbn0iLCIvKiFcbiogc3VydmV5anMgRWRpdG9yIHYwLjkuMTBcbiogKGMpIEFuZHJldyBUZWxub3YgLSBodHRwOi8vc3VydmV5anMub3JnL2J1aWxkZXIvXG4qIEdpdGh1YiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXd0ZWxub3Yvc3VydmV5LmpzLmVkaXRvclxuKi9cblxubW9kdWxlIHRlbXBsYXRlRWRpdG9yLmtvIHsgZXhwb3J0IHZhciBodG1sID0gJzxkaXYgY2xhc3M9XCJyb3cgbmF2LXRhYnNcIj4gICAgPGRpdiBjbGFzcz1cImNvbC1tZC02XCI+ICAgICAgICA8bmF2IGNsYXNzPVwibmF2YmFyLWRlZmF1bHRcIj4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyLWZsdWlkXCI+ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIj4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cIm5hdiBuYXYtdGFicyBuby1ib3JkZXJzXCI+ICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGRhdGEtYmluZD1cImNzczoge2FjdGl2ZToga29Jc1Nob3dEZXNpZ25lcigpfVwiPjxhIGhyZWY9XCIjXCIgZGF0YS1iaW5kPVwiY2xpY2s6c2VsZWN0RGVzaWduZXJDbGljaywgdGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2VkLmRlc2lnbmVyXFwnKVwiPjwvYT48L2xpPiAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBkYXRhLWJpbmQ9XCJjc3M6IHthY3RpdmU6ICFrb0lzU2hvd0Rlc2lnbmVyKCl9XCI+PGEgaHJlZj1cIiNcIiBkYXRhLWJpbmQ9XCJjbGljazpzZWxlY3RFZGl0b3JDbGljaywgdGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2VkLmpzb25FZGl0b3JcXCcpXCI+PC9hPjwvbGk+ICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGRhdGEtYmluZD1cInZpc2libGU6IGtvSXNTaG93RGVzaWduZXJcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjVweFwiPjxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgZGF0YS1iaW5kPVwiZW5hYmxlOnVuZG9SZWRvLmtvQ2FuVW5kbywgY2xpY2s6IGRvVW5kb0NsaWNrXCI+PHNwYW4gZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2VkLnVuZG9cXCcpXCI+PC9zcGFuPjwvYnV0dG9uPjwvbGk+ICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGRhdGEtYmluZD1cInZpc2libGU6IGtvSXNTaG93RGVzaWduZXJcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjVweFwiPjxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgZGF0YS1iaW5kPVwiZW5hYmxlOnVuZG9SZWRvLmtvQ2FuUmVkbywgY2xpY2s6IGRvUmVkb0NsaWNrXCI+PHNwYW4gZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2VkLnJlZG9cXCcpXCI+PC9zcGFuPjwvYnV0dG9uPjwvbGk+ICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGRhdGEtYmluZD1cInZpc2libGU6IGtvSXNTaG93RGVzaWduZXIoKSAmJiBrb1Nob3dPcHRpb25zKClcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjVweFwiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuLWdyb3VwXCI+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdCBkcm9wZG93bi10b2dnbGVcIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgYXJpYS1oYXNwb3B1cD1cInRydWVcIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIiBkYXRhLWJpbmQ9XCJ0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwnZWQub3B0aW9uc1xcJylcIj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPcHRpb25zIDxzcGFuIGNsYXNzPVwiY2FyZXRcIj48L3NwYW4+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cImRyb3Bkb3duLW1lbnVcIj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgZGF0YS1iaW5kPVwiY3NzOiB7YWN0aXZlOiBrb0dlbmVyYXRlVmFsaWRKU09OfVwiPjxhIGhyZWY9XCIjXCIgZGF0YS1iaW5kPVwiY2xpY2s6Z2VuZXJhdGVWYWxpZEpTT05DbGljaywgdGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2VkLmdlbmVyYXRlVmFsaWRKU09OXFwnKVwiPjwvYT48L2xpPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBkYXRhLWJpbmQ9XCJjc3M6IHthY3RpdmU6ICFrb0dlbmVyYXRlVmFsaWRKU09OKCl9XCI+PGEgaHJlZj1cIiNcIiBkYXRhLWJpbmQ9XCJjbGljazpnZW5lcmF0ZVJlYWRhYmxlSlNPTkNsaWNrLCB0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwnZWQuZ2VuZXJhdGVSZWFkYWJsZUpTT05cXCcpXCI+PC9hPjwvbGk+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPiAgICAgICAgICAgICAgICAgICAgPC91bD4gICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDwvZGl2PiAgICAgICAgPC9uYXY+ICAgIDwvZGl2PiAgICA8ZGl2IGNsYXNzPVwiY29sLW1kLTYgc3ZkX25hdmJhcmJ1dHRvbnNcIj4gICAgICAgIDxuYXYgY2xhc3M9XCJuYXZiYXItZGVmYXVsdCBwdWxsLXJpZ2h0XCI+ICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJ0bi10b29sYmFyXCIgcm9sZT1cInRvb2xiYXJcIj4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBkYXRhLWJpbmQ9XCJjbGljazogcnVuU3VydmV5Q2xpY2tcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjc3VydmV5RXhhbXBsZU1vZGFsXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsYXlcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+PHNwYW4gZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2VkLnJ1blN1cnZleVxcJylcIj48L3NwYW4+PC9idXR0b24+ICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgZGF0YS1iaW5kPVwiY2xpY2s6IGVtYmVkaW5nU3VydmV5Q2xpY2tcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS10YXJnZXQ9XCIjc3VydmV5RW1iZWRpbmdNb2RhbFwiPjxzcGFuIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdlZC5lbWJlZFN1cnZleVxcJylcIj48L3NwYW4+PC9idXR0b24+ICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgZGF0YS1iaW5kPVwidmlzaWJsZToga29TaG93U2F2ZUJ1dHRvbiwgY2xpY2s6IHNhdmVCdXR0b25DbGlja1wiPjxzcGFuIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdlZC5zYXZlU3VydmV5XFwnKVwiPjwvc3Bhbj48L2J1dHRvbj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgIDwvbmF2PiAgICA8L2Rpdj4gICAgPC9kaXY+ICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWxcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj4gICAgICAgICAgICA8ZGl2IGlkPVwic3VydmV5anNFZGl0b3JcIiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOiAha29Jc1Nob3dEZXNpZ25lcigpXCIgc3R5bGU9XCJoZWlnaHQ6NDUwcHg7d2lkdGg6MTAwJVwiPjwvZGl2PiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOiBrb0lzU2hvd0Rlc2lnbmVyKClcIj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvdyBjb2wtbWQtOVwiPiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1tZC0zXCI+ICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsIHBhbmVsLWRlZmF1bHRcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdlZC50b29sYm94XFwnKVwiPjwvYj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG4tZ3JvdXAtdmVydGljYWxcIiBzdHlsZT1cIndpZHRoOjEwMCU7cGFkZGluZy1yaWdodDoycHhcIj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0ga28gZm9yZWFjaDogcXVlc3Rpb25UeXBlcyAtLT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBzdHlsZT1cInRleHQtYWxpZ246bGVmdDsgcGFkZGluZy1sZWZ0OjEwcHg7IG1hcmdpbjoxcHg7d2lkdGg6MTAwJVwiIGRyYWdnYWJsZT1cInRydWVcIiBkYXRhLWJpbmQ9XCJjbGljazogJHBhcmVudC5jbGlja1F1ZXN0aW9uLCBldmVudDp7ZHJhZ3N0YXJ0OiBmdW5jdGlvbihlbCwgZSkgeyAkcGFyZW50LmRyYWdnaW5nUXVlc3Rpb24oJGRhdGEsIGUpOyByZXR1cm4gdHJ1ZTt9fVwiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdxdC5cXCcgKyAkZGF0YSlcIj48L3NwYW4+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0gL2tvICAtLT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0ga28gZm9yZWFjaDoga29Db3BpZWRRdWVzdGlvbnMgLS0+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5XCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmxlZnQ7IHBhZGRpbmctbGVmdDoxMHB4OyBtYXJnaW46MXB4O3dpZHRoOjEwMCVcIiBkcmFnZ2FibGU9XCJ0cnVlXCIgZGF0YS1iaW5kPVwiY2xpY2s6ICRwYXJlbnQuY2xpY2tDb3BpZWRRdWVzdGlvbiwgZXZlbnQ6e2RyYWdzdGFydDogZnVuY3Rpb24oZWwsIGUpIHsgJHBhcmVudC5kcmFnZ2luZ0NvcGllZFF1ZXN0aW9uKCRkYXRhLCBlKTsgcmV0dXJuIHRydWU7fX1cIj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBkYXRhLWJpbmQ9XCJ0ZXh0Om5hbWVcIj48L3NwYW4+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0gL2tvICAtLT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtbWQtOVwiPiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgZGF0YS1iaW5kPVwidGVtcGxhdGU6IHsgbmFtZTogXFwncGFnZWVkaXRvclxcJywgZGF0YTogcGFnZXNFZGl0b3IgfVwiPjwvZGl2PiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJvdmVyZmxvdy15OiBzY3JvbGw7aGVpZ2h0OjQ1MHB4O1wiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwic3VydmV5anNcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48L2Rpdj4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1tZC0zXCI+ICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWwgcGFuZWwtZGVmYXVsdFwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkaW5nXCI+ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cFwiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cIm9wdGlvbnM6IGtvT2JqZWN0cywgb3B0aW9uc1RleHQ6IFxcJ3RleHRcXCcsIHZhbHVlOiBrb1NlbGVjdGVkT2JqZWN0XCI+PC9zZWxlY3Q+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImlucHV0LWdyb3VwLWJ0blwiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiB0eXBlPVwiYnV0dG9uXCIgZGF0YS1iaW5kPVwiZW5hYmxlOiBrb0NhbkRlbGV0ZU9iamVjdCwgY2xpY2s6IGRlbGV0ZUN1cnJlbnRPYmplY3QsIGF0dHI6IHsgdGl0bGU6ICRyb290LmdldExvY1N0cmluZyhcXCdlZC5kZWxTZWxPYmplY3RcXCcpfVwiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmVcIj48L3NwYW4+PC9idXR0b24+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgZGF0YS1iaW5kPVwidGVtcGxhdGU6IHsgbmFtZTogXFwnb2JqZWN0ZWRpdG9yXFwnLCBkYXRhOiBzZWxlY3RlZE9iamVjdEVkaXRvciB9XCI+PC9kaXY+ICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWZvb3RlclwiIGRhdGEtYmluZD1cInZpc2libGU6c3VydmV5VmVyYnMua29IYXNWZXJic1wiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGRhdGEtYmluZD1cInRlbXBsYXRlOiB7IG5hbWU6IFxcJ29iamVjdHZlcmJzXFwnLCBkYXRhOiBzdXJ2ZXlWZXJicyB9XCI+PC9kaXY+ICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgPC9kaXY+ICAgICAgICA8L2Rpdj4gICAgICAgIDxkaXYgaWQ9XCJzdXJ2ZXlFeGFtcGxlTW9kYWxcIiBjbGFzcz1cIm1vZGFsIGZhZGVcIiByb2xlPVwiZGlhbG9nXCI+ICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWRpYWxvZ1wiPiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWwtY29udGVudFwiPiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWhlYWRlclwiPiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiPiZ0aW1lczs8L2J1dHRvbj4gICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3M9XCJtb2RhbC10aXRsZVwiIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdlZC5ydW5TdXJ2ZXlcXCcpXCI+PC9oND4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWJvZHlcIj4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGlkPVwic3VydmV5anNFeGFtcGxlXCI+PC9kaXY+ICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cInN1cnZleWpzRXhhbXBsZVJlc3VsdHNcIj48L2Rpdj4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgIDwvZGl2PiAgICAgICAgPGRpdiBpZD1cInN1cnZleUVtYmVkaW5nTW9kYWxcIiBjbGFzcz1cIm1vZGFsIGZhZGVcIiByb2xlPVwiZGlhbG9nXCI+ICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWRpYWxvZ1wiPiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWwtY29udGVudFwiPiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWhlYWRlclwiPiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJtb2RhbFwiPiZ0aW1lczs8L2J1dHRvbj4gICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3M9XCJtb2RhbC10aXRsZVwiIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdlZC5lbWJlZFN1cnZleVxcJylcIj48L2g0PiAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWwtYm9keVwiPiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgZGF0YS1iaW5kPVwidGVtcGxhdGU6IHsgbmFtZTogXFwnc3VydmV5ZW1iZWRpbmdcXCcsIGRhdGE6IHN1cnZleUVtYmVkaW5nIH1cIj48L2Rpdj4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgIDwvZGl2PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwib2JqZWN0ZWRpdG9yXCI+ICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHN2ZF90YWJsZS1ub3dyYXBcIj4gICAgICAgIDx0Ym9keSBkYXRhLWJpbmQ9XCJmb3JlYWNoOiBrb1Byb3BlcnRpZXNcIj4gICAgICAgICAgICA8dHIgZGF0YS1iaW5kPVwiY2xpY2s6ICRwYXJlbnQuY2hhbmdlQWN0aXZlUHJvcGVydHkoJGRhdGEpLCBjc3M6IHtcXCdhY3RpdmVcXCc6ICRwYXJlbnQua29BY3RpdmVQcm9wZXJ0eSgpID09ICRkYXRhfVwiPiAgICAgICAgICAgICAgICA8dGQgZGF0YS1iaW5kPVwidGV4dDogZGlzcGxheU5hbWUsIGF0dHI6IHt0aXRsZTogdGl0bGV9XCIgd2lkdGg9XCI1MCVcIj48L3RkPiAgICAgICAgICAgICAgICA8dGQgd2lkdGg9XCI1MCVcIj4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGRhdGEtYmluZD1cInRleHQ6IGtvVGV4dCwgdmlzaWJsZTogJHBhcmVudC5rb0FjdGl2ZVByb3BlcnR5KCkgIT0gJGRhdGEsIGF0dHI6IHt0aXRsZToga29UZXh0fSwgc3R5bGU6IHtjb2xvcjoga29Jc0RlZmF1bHQoKSA/IFxcJ2dyYXlcXCcgOiBcXCdcXCd9XCIgc3R5bGU9XCJ0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW5cIj48L3NwYW4+ICAgICAgICAgICAgICAgICAgICA8ZGl2IGRhdGEtYmluZD1cInZpc2libGU6ICRwYXJlbnQua29BY3RpdmVQcm9wZXJ0eSgpID09ICRkYXRhXCI+ICAgICAgICAgICAgICAgICAgICAgICAgPCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiBcXCdwcm9wZXJ0eWVkaXRvci1cXCcgKyBiYXNlRWRpdG9yVHlwZSwgZGF0YTogJGRhdGEgfSAtLT4gICAgICAgICAgICAgICAgICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICA8L3RkPiAgICAgICAgICAgIDwvdHI+ICAgICAgICA8L3Rib2R5PiAgICA8L3RhYmxlPjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwib2JqZWN0dmVyYnNcIj4gICAgPCEtLSBrbyBmb3JlYWNoOiBrb1ZlcmJzIC0tPiAgICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cFwiPiAgICAgICAgICAgICAgICA8c3BhbiAgY2xhc3M9XCJpbnB1dC1ncm91cC1hZGRvblwiIGRhdGEtYmluZD1cInRleHQ6dGV4dFwiPjwvc3Bhbj4gICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cIm9wdGlvbnM6IGtvSXRlbXMsIG9wdGlvbnNUZXh0OiBcXCd0ZXh0XFwnLCBvcHRpb25zVmFsdWU6XFwndmFsdWVcXCcsIHZhbHVlOiBrb1NlbGVjdGVkSXRlbVwiPjwvc2VsZWN0PiAgICAgICAgICAgIDwvZGl2PiAgICAgICAgPC9kaXY+ICAgIDwhLS0gL2tvICAtLT48L3NjcmlwdD48c2NyaXB0IHR5cGU9XCJ0ZXh0L2h0bWxcIiBpZD1cInBhZ2VlZGl0b3JcIj4gICAgPHVsIGNsYXNzPVwibmF2IG5hdi10YWJzXCIgZGF0YS1iaW5kPVwidGFiczp0cnVlXCI+ICAgICAgICA8IS0tIGtvIGZvcmVhY2g6IGtvUGFnZXMgLS0+ICAgICAgICA8bGkgZGF0YS1iaW5kPVwiY3NzOiB7YWN0aXZlOiBrb1NlbGVjdGVkKCl9LGV2ZW50OnsgICAgICAgICAgIGtleWRvd246ZnVuY3Rpb24oZWwsIGUpeyAkcGFyZW50LmtleURvd24oZWwsIGUpOyB9LCAgICAgICAgICAgZHJhZ3N0YXJ0OmZ1bmN0aW9uKGVsLCBlKXsgJHBhcmVudC5kcmFnU3RhcnQoZWwpOyByZXR1cm4gdHJ1ZTsgfSwgICAgICAgICAgIGRyYWdvdmVyOmZ1bmN0aW9uKGVsLCBlKXsgJHBhcmVudC5kcmFnT3ZlcihlbCk7fSwgICAgICAgICAgIGRyYWdlbmQ6ZnVuY3Rpb24oZWwsIGUpeyAkcGFyZW50LmRyYWdFbmQoKTt9LCAgICAgICAgICAgZHJvcDpmdW5jdGlvbihlbCwgZSl7ICRwYXJlbnQuZHJhZ0Ryb3AoZWwpO30gICAgICAgICB9XCI+ICAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgZGF0YS1iaW5kPVwiY2xpY2s6JHBhcmVudC5zZWxlY3RQYWdlQ2xpY2tcIj4gICAgICAgICAgICAgICAgPHNwYW4gZGF0YS1iaW5kPVwidGV4dDogdGl0bGVcIj48L3NwYW4+ICAgICAgICAgICAgPC9hPiAgICAgICAgPC9saT4gICAgICAgIDwhLS0gL2tvICAtLT4gICAgICAgIDxsaT48YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiIGRhdGEtYmluZD1cImNsaWNrOmFkZE5ld1BhZ2VDbGlja1wiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCI+PC9zcGFuPjwvYnV0dG9uPjwvbGk+ICAgIDwvdWw+PC9zY3JpcHQ+PHNjcmlwdCB0eXBlPVwidGV4dC9odG1sXCIgaWQ9XCJwcm9wZXJ0eWVkaXRvci1hcnJheVwiPiAgICA8ZGl2PiAgICAgICAgPHNwYW4gZGF0YS1iaW5kPVwidGV4dDoga29UZXh0XCI+PC9zcGFuPiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiBkYXRhLXRvZ2dsZT1cIm1vZGFsXCIgZGF0YS1iaW5kPVwiYXR0cjoge1xcJ2RhdGEtdGFyZ2V0XFwnIDogbW9kYWxOYW1lVGFyZ2V0fSwgdGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmVkaXRcXCcpXCI+PC9idXR0b24+ICAgIDwvZGl2PiAgICA8ZGl2IGRhdGEtYmluZD1cImF0dHI6IHtpZCA6IG1vZGFsTmFtZX1cIiBjbGFzcz1cIm1vZGFsIGZhZGVcIiByb2xlPVwiZGlhbG9nXCI+ICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWwtZGlhbG9nXCI+ICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWNvbnRlbnRcIj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWhlYWRlclwiPiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCI+JnRpbWVzOzwvYnV0dG9uPiAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzPVwibW9kYWwtdGl0bGVcIiBkYXRhLWJpbmQ9XCJ0ZXh0OmFycmF5RWRpdG9yLnRpdGxlXCI+PC9oND4gICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWJvZHkgc3ZkX25vdG9wYm90dG9tcGFkZGluZ3NcIj4gICAgICAgICAgICAgICAgICAgIDwhLS0ga28gdGVtcGxhdGU6IHsgbmFtZTogXFwncHJvcGVydHllZGl0b3ItXFwnICsgZWRpdG9yVHlwZSwgZGF0YTogYXJyYXlFZGl0b3IgfSAtLT4gICAgICAgICAgICAgICAgICAgIDwhLS0gL2tvIC0tPiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWZvb3RlclwiPiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeVwiIGRhdGEtYmluZD1cImNsaWNrOiBhcnJheUVkaXRvci5vbkFwcGx5Q2xpY2ssIHZhbHVlOiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUuYXBwbHlcXCcpXCIgc3R5bGU9XCJ3aWR0aDoxMDBweFwiIC8+ICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgZGF0YS1kaXNtaXNzPVwibW9kYWxcIiBkYXRhLWJpbmQ9XCJ2YWx1ZTogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmNsb3NlXFwnKVwiIHN0eWxlPVwid2lkdGg6MTAwcHhcIiAvPiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgIDwvZGl2PiAgICA8L2Rpdj48L3NjcmlwdD48c2NyaXB0IHR5cGU9XCJ0ZXh0L2h0bWxcIiBpZD1cInByb3BlcnR5ZWRpdG9yLWJvb2xlYW5cIj4gICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGRhdGEtYmluZD1cImNoZWNrZWQ6IGtvVmFsdWVcIiAvPjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwicHJvcGVydHllZGl0b3ItZHJvcGRvd25cIj4gICAgPHNlbGVjdCBkYXRhLWJpbmQ9XCJ2YWx1ZToga29WYWx1ZSwgb3B0aW9uczogY2hvaWNlc1wiICBzdHlsZT1cIndpZHRoOjEwMCVcIj48L3NlbGVjdD48L3NjcmlwdD48c2NyaXB0IHR5cGU9XCJ0ZXh0L2h0bWxcIiBpZD1cInByb3BlcnR5ZWRpdG9yLWh0bWxcIj4gICAgPHRleHRhcmVhIGRhdGEtYmluZD1cInZhbHVlOmtvVmFsdWVcIiBzdHlsZT1cIndpZHRoOjEwMCVcIiByb3dzPVwiMTBcIj48L3RleHRhcmVhPjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwicHJvcGVydHllZGl0b3ItaXRlbXZhbHVlc1wiPjx0YWJsZSBjbGFzcz1cInRhYmxlXCI+ICAgIDx0aGVhZD4gICAgICAgIDx0cj4gICAgICAgICAgICA8dGggZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLnZhbHVlXFwnKVwiPjwvdGg+ICAgICAgICAgICAgPHRoIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS50ZXh0XFwnKVwiPjwvdGg+ICAgICAgICAgICAgPHRoPjwvdGg+ICAgICAgICA8L3RyPiAgICA8L3RoZWFkPiAgICA8dGJvZHk+ICAgICAgICA8IS0tIGtvIGZvcmVhY2g6IGtvSXRlbXMgLS0+ICAgICAgICA8dHI+ICAgICAgICAgICAgPHRkPiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cInZhbHVlOmtvVmFsdWVcIiBzdHlsZT1cIndpZHRoOjIwMHB4XCIgLz4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlciBuby1wYWRkaW5nXCIgcm9sZT1cImFsZXJ0XCIgZGF0YS1iaW5kPVwidmlzaWJsZTprb0hhc0Vycm9yLCB0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUuZW50ZXJOZXdWYWx1ZVxcJylcIj48L2Rpdj4gICAgICAgICAgICA8L3RkPiAgICAgICAgICAgIDx0ZD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cInZhbHVlOmtvVGV4dFwiIHN0eWxlPVwid2lkdGg6MjAwcHhcIiAvPjwvdGQ+ICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG5cIiBkYXRhLWJpbmQ9XCJjbGljazogJHBhcmVudC5vbkRlbGV0ZUNsaWNrLCB2YWx1ZTogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmRlbGV0ZVxcJylcIi8+PC90ZD4gICAgICAgIDwvdHI+ICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgIDx0cj4gICAgICAgICAgICA8dGQgY29sc3Bhbj1cIjNcIj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvdyBidG4tdG9vbGJhclwiPiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGRhdGEtYmluZD1cImNsaWNrOiBvbkFkZENsaWNrLCB2YWx1ZTogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmFkZE5ld1xcJylcIiAvPiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGFuZ2VyXCIgZGF0YS1iaW5kPVwiY2xpY2s6IG9uQ2xlYXJDbGljaywgdmFsdWU6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS5yZW1vdmVBbGxcXCcpXCIvPiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8L3RkPiAgICAgICAgPC90cj4gICAgPC90Ym9keT48L3RhYmxlPjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwicHJvcGVydHllZGl0b3ItbWF0cml4ZHJvcGRvd25jb2x1bW5zXCI+ICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlXCI+ICAgICAgICA8dGhlYWQ+ICAgICAgICAgICAgPHRyPiAgICAgICAgICAgICAgICA8dGggZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLnJlcXVpcmVkXFwnKVwiPjwvdGg+ICAgICAgICAgICAgICAgIDx0aCBkYXRhLWJpbmQ9XCJ0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUuY2VsbFR5cGVcXCcpXCI+PC90aD4gICAgICAgICAgICAgICAgPHRoIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS5uYW1lXFwnKVwiPjwvdGg+ICAgICAgICAgICAgICAgIDx0aCBkYXRhLWJpbmQ9XCJ0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUudGl0bGVcXCcpXCI+PC90aD4gICAgICAgICAgICAgICAgPHRoPjwvdGg+ICAgICAgICAgICAgPC90cj4gICAgICAgIDwvdGhlYWQ+ICAgICAgICA8dGJvZHk+ICAgICAgICAgICAgPCEtLSBrbyBmb3JlYWNoOiBrb0l0ZW1zIC0tPiAgICAgICAgICAgIDx0cj4gICAgICAgICAgICAgICAgPHRkPiAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOmtvSGFzQ2hvaWNlcywgY2xpY2s6IG9uU2hvd0Nob2ljZXNDbGlja1wiPiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uXCIgZGF0YS1iaW5kPVwiY3NzOiB7XFwnZ2x5cGhpY29uLWNoZXZyb24tZG93blxcJzogIWtvU2hvd0Nob2ljZXMoKSwgXFwnZ2x5cGhpY29uLWNoZXZyb24tdXBcXCc6IGtvU2hvd0Nob2ljZXMoKX1cIj48L3NwYW4+ICAgICAgICAgICAgICAgICAgICA8L2E+ICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgZGF0YS1iaW5kPVwiY2hlY2tlZDoga29Jc1JlcXVpcmVkXCIgLz4gICAgICAgICAgICAgICAgPC90ZD4gICAgICAgICAgICAgICAgPHRkPiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cIm9wdGlvbnM6IGNlbGxUeXBlQ2hvaWNlcywgdmFsdWU6IGtvQ2VsbFR5cGVcIiAgc3R5bGU9XCJ3aWR0aDoxMTBweFwiPjwvc2VsZWN0PiAgICAgICAgICAgICAgICA8L3RkPiAgICAgICAgICAgICAgICA8dGQ+ICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cInZhbHVlOmtvTmFtZVwiIHN0eWxlPVwid2lkdGg6MTAwcHhcIiAvPiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlciBuby1wYWRkaW5nXCIgcm9sZT1cImFsZXJ0XCIgZGF0YS1iaW5kPVwidmlzaWJsZTprb0hhc0Vycm9yLCB0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUuZW50ZXJOZXdWYWx1ZVxcJylcIj48L2Rpdj4gICAgICAgICAgICAgICAgPC90ZD4gICAgICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1iaW5kPVwidmFsdWU6a29UaXRsZVwiIHN0eWxlPVwid2lkdGg6MTIwcHhcIiAvPjwvdGQ+ICAgICAgICAgICAgICAgIDx0ZD48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuXCIgZGF0YS1iaW5kPVwiY2xpY2s6ICRwYXJlbnQub25EZWxldGVDbGljaywgdmFsdWU6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS5kZWxldGVcXCcpXCIvPjwvdGQ+ICAgICAgICAgICAgPC90cj4gICAgICAgICAgICA8dHIgZGF0YS1iaW5kPVwidmlzaWJsZToga29TaG93Q2hvaWNlcygpICYmIGtvSGFzQ2hvaWNlcygpXCI+ICAgICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiNFwiIHN0eWxlPVwiYm9yZGVyLXRvcC1zdHlsZTpub25lXCI+ICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPiAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWwgY29sLXNtLTNcIiBkYXRhLWJpbmQ9XCJ0ZXh0OiRyb290LmdldExvY1N0cmluZyhcXCdwZS5oYXNPdGhlclxcJylcIj48L2xhYmVsPiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtc20tMlwiPiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgZGF0YS1iaW5kPVwiY2hlY2tlZDoga29IYXNPdGhlclwiIC8+ICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1zbS03XCIgZGF0YS1iaW5kPVwidmlzaWJsZTogIWtvSGFzQ29sQ291bnQoKVwiPjwvZGl2PiAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWwgY29sLXNtLTNcIiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOmtvSGFzQ29sQ291bnQsIHRleHQ6JHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmNvbENvdW50XFwnKVwiPjwvbGFiZWw+ICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cImZvcm0tY29udHJvbCBjb2wtc20tNFwiIGRhdGEtYmluZD1cInZpc2libGU6a29IYXNDb2xDb3VudCwgb3B0aW9uczogY29sQ291bnRDaG9pY2VzLCB2YWx1ZToga29Db2xDb3VudFwiIHN0eWxlPVwid2lkdGg6MTEwcHhcIj48L3NlbGVjdD4gICAgICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICAgICAgPCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiBcXCdwcm9wZXJ0eWVkaXRvci1pdGVtdmFsdWVzXFwnLCBkYXRhOiBjaG9pY2VzRWRpdG9yIH0gLS0+ICAgICAgICAgICAgICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgICAgICAgICAgPC90ZD4gICAgICAgICAgICA8L3RyPiAgICAgICAgICAgIDwhLS0gL2tvIC0tPiAgICAgICAgICAgIDx0cj4gICAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIzXCI+ICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93IGJ0bi10b29sYmFyXCI+ICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGRhdGEtYmluZD1cImNsaWNrOiBvbkFkZENsaWNrLCB2YWx1ZTogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmFkZE5ld1xcJylcIi8+ICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGFuZ2VyXCIgZGF0YS1iaW5kPVwiY2xpY2s6IG9uQ2xlYXJDbGljaywgdmFsdWU6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS5yZW1vdmVBbGxcXCcpXCJcIiAvPiAgICAgICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgIDwvdGQ+ICAgICAgICAgICAgPC90cj4gICAgICAgIDwvdGJvZHk+ICAgIDwvdGFibGU+PC9zY3JpcHQ+PHNjcmlwdCB0eXBlPVwidGV4dC9odG1sXCIgaWQ9XCJwcm9wZXJ0eWVkaXRvci1udW1iZXJcIj4gICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBkYXRhLWJpbmQ9XCJ2YWx1ZToga29WYWx1ZVwiIHN0eWxlPVwid2lkdGg6MTAwJVwiIC8+PC9zY3JpcHQ+PHNjcmlwdCB0eXBlPVwidGV4dC9odG1sXCIgaWQ9XCJwcm9wZXJ0eWVkaXRvci1zdHJpbmdcIj4gICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgZGF0YS1iaW5kPVwidmFsdWU6IGtvVmFsdWVcIiBzdHlsZT1cIndpZHRoOjEwMCVcIiAvPjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwicHJvcGVydHllZGl0b3ItdGV4dGl0ZW1zXCI+PGRpdiBjbGFzcz1cInBhbmVsXCI+ICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlXCI+ICAgICAgICA8dGhlYWQ+ICAgICAgICAgICAgPHRyPiAgICAgICAgICAgICAgICA8dGggZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLm5hbWVcXCcpXCI+PC90aD4gICAgICAgICAgICAgICAgPHRoIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS50aXRsZVxcJylcIj48L3RoPiAgICAgICAgICAgICAgICA8dGg+PC90aD4gICAgICAgICAgICA8L3RyPiAgICAgICAgPC90aGVhZD4gICAgICAgIDx0Ym9keT4gICAgICAgICAgICA8IS0tIGtvIGZvcmVhY2g6IGtvSXRlbXMgLS0+ICAgICAgICAgICAgPHRyPiAgICAgICAgICAgICAgICA8dGQ+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWJpbmQ9XCJ2YWx1ZTprb05hbWVcIiBzdHlsZT1cIndpZHRoOjIwMHB4XCIgLz48L3RkPiAgICAgICAgICAgICAgICA8dGQ+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWJpbmQ9XCJ2YWx1ZTprb1RpdGxlXCIgc3R5bGU9XCJ3aWR0aDoyMDBweFwiIC8+PC90ZD4gICAgICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG5cIiBkYXRhLWJpbmQ9XCJjbGljazogJHBhcmVudC5vbkRlbGV0ZUNsaWNrLCB2YWx1ZTogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmRlbGV0ZVxcJylcIi8+PC90ZD4gICAgICAgICAgICA8L3RyPiAgICAgICAgICAgIDwhLS0gL2tvIC0tPiAgICAgICAgICAgIDx0cj4gICAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCI0XCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIGRhdGEtYmluZD1cImNsaWNrOiBvbkFkZENsaWNrLCB2YWx1ZTogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmFkZE5ld1xcJylcIi8+PC90ZD4gICAgICAgICAgICA8L3RyPiAgICAgICAgPC90Ym9keT4gICAgPC90YWJsZT48L2Rpdj48L3NjcmlwdD48c2NyaXB0IHR5cGU9XCJ0ZXh0L2h0bWxcIiBpZD1cInByb3BlcnR5ZWRpdG9yLXRyaWdnZXJzXCI+PGRpdiBjbGFzcz1cInBhbmVsXCI+ICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkaW5nXCI+ICAgICAgICA8ZGl2IGNsYXNzPVwicm93IGlucHV0LWdyb3VwXCI+ICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJkcm9wZG93bi10b2dnbGUgaW5wdXQtZ3JvdXAtYWRkb25cIiBkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCIgYXJpYS1oYXNwb3B1cD1cInRydWVcIiBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIj4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsdXNcIj48L3NwYW4+ICAgICAgICAgICAgPC9idXR0b24+ICAgICAgICAgICAgPHVsIGNsYXNzPVwiZHJvcGRvd24tbWVudSBpbnB1dC1ncm91cFwiPiAgICAgICAgICAgICAgICA8IS0tIGtvIGZvcmVhY2g6IGF2YWlsYWJsZVRyaWdnZXJzIC0tPiAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBkYXRhLWJpbmQ9XCJjbGljazogJHBhcmVudC5vbkFkZENsaWNrKCRkYXRhKVwiPjxzcGFuIGRhdGEtYmluZD1cInRleHQ6JGRhdGFcIj48L3NwYW4+PC9hPjwvbGk+ICAgICAgICAgICAgICAgIDwhLS0gL2tvICAtLT4gICAgICAgICAgICA8L3VsPiAgICAgICAgICAgIDxzZWxlY3QgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWJpbmQ9XCJvcHRpb25zOiBrb0l0ZW1zLCBvcHRpb25zVGV4dDogXFwna29UZXh0XFwnLCB2YWx1ZToga29TZWxlY3RlZFwiPjwvc2VsZWN0PiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaW5wdXQtZ3JvdXAtYnRuXCI+ICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGRhdGEtYmluZD1cImVuYWJsZToga29TZWxlY3RlZCgpICE9IG51bGwsIGNsaWNrOiBvbkRlbGV0ZUNsaWNrXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIj48c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tcmVtb3ZlXCI+PC9zcGFuPjwvYnV0dG9uPiAgICAgICAgICAgIDwvc3Bhbj4gICAgICAgIDwvZGl2PiAgICA8L2Rpdj4gICAgPGRpdiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOiBrb1NlbGVjdGVkKCkgPT0gbnVsbFwiPiAgICAgICAgPGRpdiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOiBrb1F1ZXN0aW9ucygpLmxlbmd0aCA9PSAwLCB0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUubm9xdWVzdGlvbnNcXCcpXCI+PC9kaXY+ICAgICAgICA8ZGl2IGRhdGEtYmluZD1cInZpc2libGU6IGtvUXVlc3Rpb25zKCkubGVuZ3RoID4gMCwgdGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLmNyZWF0ZXRyaWdnZXJcXCcpXCI+PC9kaXY+ICAgIDwvZGl2PiAgICA8ZGl2IGRhdGEtYmluZD1cInZpc2libGU6IGtvU2VsZWN0ZWQoKSAhPSBudWxsXCI+ICAgICAgICA8ZGl2IGRhdGEtYmluZD1cIndpdGg6IGtvU2VsZWN0ZWRcIj4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93IGZvcm0taW5saW5lXCI+ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtc20tNFwiPiAgICAgICAgICAgICAgICAgICAgPHNwYW4gZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLnRyaWdnZXJPblxcJylcIj48L3NwYW4+PHNlbGVjdCBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtYmluZD1cIm9wdGlvbnM6JHBhcmVudC5rb1F1ZXN0aW9ucywgdmFsdWU6IGtvTmFtZVwiPjwvc2VsZWN0PiA8c3Bhbj4gPC9zcGFuPiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1zbS00XCI+ICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1iaW5kPVwib3B0aW9uczphdmFpbGFibGVPcGVyYXRvcnMsIG9wdGlvbnNWYWx1ZTogXFwnbmFtZVxcJywgb3B0aW9uc1RleHQ6IFxcJ3RleHRcXCcsIHZhbHVlOmtvT3BlcmF0b3JcIj48L3NlbGVjdD4gICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtc20tNFwiPiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgc3R5bGU9XCJwYWRkaW5nOiAwXCIgdHlwZT1cInRleHRcIiBkYXRhLWJpbmQ9XCJ2aXNpYmxlOiBrb1JlcXVpcmVWYWx1ZSwgdmFsdWU6a29WYWx1ZVwiIC8+ICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDwhLS0ga28gaWY6IGtvVHlwZSgpID09IFxcJ3Zpc2libGV0cmlnZ2VyXFwnIC0tPiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+ICAgICAgICAgICAgICAgICAgICA8IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6IFxcJ3Byb3BlcnR5ZWRpdG9yLXRyaWdnZXJzaXRlbXNcXCcsIGRhdGE6IHBhZ2VzIH0gLS0+ICAgICAgICAgICAgICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgICAgICAgICAgPC9kaXY+ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtc20tNlwiPiAgICAgICAgICAgICAgICAgICAgPCEtLSBrbyB0ZW1wbGF0ZTogeyBuYW1lOiBcXCdwcm9wZXJ0eWVkaXRvci10cmlnZ2Vyc2l0ZW1zXFwnLCBkYXRhOiBxdWVzdGlvbnMgfSAtLT4gICAgICAgICAgICAgICAgICAgIDwhLS0gL2tvIC0tPiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgICAgICA8IS0tIGtvIGlmOiBrb1R5cGUoKSA9PSBcXCdjb21wbGV0ZXRyaWdnZXJcXCcgLS0+ICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPiAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJtYXJnaW46IDEwcHhcIiBkYXRhLWJpbmQ9XCJ0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwncGUudHJpZ2dlckNvbXBsZXRlVGV4dFxcJylcIj48L2Rpdj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgICAgICA8IS0tIGtvIGlmOiBrb1R5cGUoKSA9PSBcXCdzZXR2YWx1ZXRyaWdnZXJcXCcgLS0+ICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvdyBmb3JtLWlubGluZVwiIHN0eWxlPVwibWFyZ2luLXRvcDoxMHB4XCI+ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtc20tNlwiPiAgICAgICAgICAgICAgICAgICAgPHNwYW4gZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ3BlLnRyaWdnZXJTZXRUb05hbWVcXCcpXCI+PC9zcGFuPjxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgZGF0YS1iaW5kPVwidmFsdWU6a29zZXRUb05hbWVcIiAvPiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1zbS0xXCI+ICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLXNtLTVcIj4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS50cmlnZ2VyU2V0VmFsdWVcXCcpXCI+PC9zcGFuPjxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgZGF0YS1iaW5kPVwidmFsdWU6a29zZXRWYWx1ZVwiIC8+ICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgZm9ybS1pbmxpbmVcIj4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1zbS0xMlwiPiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGRhdGEtYmluZD1cImNoZWNrZWQ6IGtvaXNWYXJpYWJsZVwiIC8+IDxzcGFuIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdwZS50cmlnZ2VySXNWYXJpYWJsZVxcJylcIj48L3NwYW4+ICAgICAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDwvZGl2PiAgICAgICAgICAgIDwhLS0gL2tvIC0tPiAgICAgICAgPC9kaXY+ICAgIDwvZGl2PjwvZGl2Pjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwicHJvcGVydHllZGl0b3ItdHJpZ2dlcnNpdGVtc1wiPiAgICA8ZGl2IGNsYXNzPVwicGFuZWwgbm8tbWFyZ2lucyBuby1wYWRkaW5nXCI+ICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWwtaGVhZGluZ1wiPiAgICAgICAgICAgIDxzcGFuIGRhdGEtYmluZD1cInRleHQ6IHRpdGxlXCI+PC9zcGFuPiAgICAgICAgPC9kaXY+ICAgICAgICA8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXBcIj4gICAgICAgICAgICA8c2VsZWN0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIGRhdGEtYmluZD1cIm9wdGlvbnM6a29DaG9vc2VuLCB2YWx1ZToga29DaG9vc2VuU2VsZWN0ZWRcIj48L3NlbGVjdD4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImlucHV0LWdyb3VwLWJ0blwiIHN0eWxlPVwidmVydGljYWwtYWxpZ246dG9wXCI+ICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGRhdGEtYmluZD1cImVuYWJsZToga29DaG9vc2VuU2VsZWN0ZWQoKSAhPSBudWxsLCBjbGljazogb25EZWxldGVDbGlja1wiIGNsYXNzPVwiYnRuXCI+PHNwYW4gY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZVwiPjwvc3Bhbj48L2J1dHRvbj4gICAgICAgICAgICA8L3NwYW4+ICAgICAgICA8L2Rpdj4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cFwiIHN0eWxlPVwibWFyZ2luLXRvcDo1cHhcIj4gICAgICAgICAgICA8c2VsZWN0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1iaW5kPVwib3B0aW9uczprb09iamVjdHMsIHZhbHVlOiBrb1NlbGVjdGVkXCI+PC9zZWxlY3Q+ICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpbnB1dC1ncm91cC1idG5cIj4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS1iaW5kPVwiZW5hYmxlOiBrb1NlbGVjdGVkKCkgIT0gbnVsbCwgY2xpY2s6IG9uQWRkQ2xpY2tcIiBzdHlsZT1cIndpZHRoOjQwcHhcIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCI+PC9zcGFuPjwvYnV0dG9uPiAgICAgICAgICAgIDwvc3Bhbj4gICAgICAgIDwvZGl2PiAgICA8L2Rpdj48L3NjcmlwdD48c2NyaXB0IHR5cGU9XCJ0ZXh0L2h0bWxcIiBpZD1cInByb3BlcnR5ZWRpdG9yLXZhbGlkYXRvcnNcIj48ZGl2IGNsYXNzPVwicGFuZWxcIj4gICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIj4gICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgaW5wdXQtZ3JvdXBcIj4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImRyb3Bkb3duLXRvZ2dsZSBpbnB1dC1ncm91cC1hZGRvblwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiBhcmlhLWhhc3BvcHVwPVwidHJ1ZVwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiPiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tcGx1c1wiPjwvc3Bhbj4gICAgICAgICAgICA8L2J1dHRvbj4gICAgICAgICAgICA8dWwgY2xhc3M9XCJkcm9wZG93bi1tZW51IGlucHV0LWdyb3VwXCI+ICAgICAgICAgICAgICAgIDwhLS0ga28gZm9yZWFjaDogYXZhaWxhYmxlVmFsaWRhdG9ycyAtLT4gICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgZGF0YS1iaW5kPVwiY2xpY2s6ICRwYXJlbnQub25BZGRDbGljaygkZGF0YSlcIj48c3BhbiBkYXRhLWJpbmQ9XCJ0ZXh0OiRkYXRhXCI+PC9zcGFuPjwvYT48L2xpPiAgICAgICAgICAgICAgICA8IS0tIC9rbyAgLS0+ICAgICAgICAgICAgPC91bD4gICAgICAgICAgICA8c2VsZWN0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1iaW5kPVwib3B0aW9uczoga29JdGVtcywgb3B0aW9uc1RleHQ6IFxcJ3RleHRcXCcsIHZhbHVlOiBrb1NlbGVjdGVkXCI+PC9zZWxlY3Q+ICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpbnB1dC1ncm91cC1idG5cIj4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS1iaW5kPVwiZW5hYmxlOiBrb1NlbGVjdGVkKCkgIT0gbnVsbCwgY2xpY2s6IG9uRGVsZXRlQ2xpY2tcIiBjbGFzcz1cImJ0blwiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmVcIj48L3NwYW4+PC9idXR0b24+ICAgICAgICAgICAgPC9zcGFuPiAgICAgICAgPC9kaXY+ICAgIDwvZGl2PiAgICA8ZGl2IGRhdGEtYmluZD1cInRlbXBsYXRlOiB7IG5hbWU6IFxcJ29iamVjdGVkaXRvclxcJywgZGF0YTogc2VsZWN0ZWRPYmplY3RFZGl0b3IgfVwiPjwvZGl2PjwvZGl2Pjwvc2NyaXB0PjxzY3JpcHQgdHlwZT1cInRleHQvaHRtbFwiIGlkPVwic3VydmV5ZW1iZWRpbmdcIj4gICAgPGRpdiBjbGFzcz1cInJvd1wiPiAgICAgICAgPHNlbGVjdCBkYXRhLWJpbmQ9XCJ2YWx1ZTprb0xpYnJhcnlWZXJzaW9uXCI+ICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImtub2Nrb3V0XCIgZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3Lmtub2Nrb3V0XFwnKVwiPjwvb3B0aW9uPiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJyZWFjdFwiIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdldy5yZWFjdFxcJylcIj48L29wdGlvbj4gICAgICAgIDwvc2VsZWN0PiAgICAgICAgPHNlbGVjdCBkYXRhLWJpbmQ9XCJ2YWx1ZTprb1NjcmlwdFVzaW5nXCI+ICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImJvb3RzdHJhcFwiIGRhdGEtYmluZD1cInRleHQ6ICRyb290LmdldExvY1N0cmluZyhcXCdldy5ib290c3RyYXBcXCcpXCI+PC9vcHRpb24+ICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0YW5kYXJkXCIgZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3LnN0YW5kYXJkXFwnKVwiPjwvb3B0aW9uPiAgICAgICAgPC9zZWxlY3Q+ICAgICAgICA8c2VsZWN0IGRhdGEtYmluZD1cInZhbHVlOmtvU2hvd0FzV2luZG93XCI+ICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBhZ2VcIiBkYXRhLWJpbmQ9XCJ0ZXh0OiAkcm9vdC5nZXRMb2NTdHJpbmcoXFwnZXcuc2hvd09uUGFnZVxcJylcIj48L29wdGlvbj4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwid2luZG93XCIgZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3LnNob3dJbldpbmRvd1xcJylcIj48L29wdGlvbj4gICAgICAgIDwvc2VsZWN0PiAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtaW5saW5lXCIgZGF0YS1iaW5kPVwidmlzaWJsZTprb0hhc0lkc1wiPiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBkYXRhLWJpbmQ9XCJjaGVja2VkOmtvTG9hZFN1cnZleVwiIC8+ICAgICAgICAgICAgPHNwYW4gZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3LmxvYWRGcm9tU2VydmVyXFwnKVwiPjwvc3Bhbj4gICAgICAgIDwvbGFiZWw+ICAgIDwvZGl2PiAgICA8ZGl2IGNsYXNzPVwicGFuZWxcIj4gICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkaW5nXCIgZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3LnRpdGxlU2NyaXB0XFwnKVwiPjwvZGl2PiAgICAgICAgPGRpdiBpZD1cInN1cnZleUVtYmVkaW5nSGVhZFwiIHN0eWxlPVwiaGVpZ2h0OjcwcHg7d2lkdGg6MTAwJVwiPjwvZGl2PiAgICA8L2Rpdj4gICAgPGRpdiBjbGFzcz1cInBhbmVsXCIgZGF0YS1iaW5kPVwidmlzaWJsZToga29WaXNpYmxlSHRtbFwiPiAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIiAgZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3LnRpdGxlSHRtbFxcJylcIj48L2Rpdj4gICAgICAgIDxkaXYgaWQ9XCJzdXJ2ZXlFbWJlZGluZ0JvZHlcIiBzdHlsZT1cImhlaWdodDozMHB4O3dpZHRoOjEwMCVcIj48L2Rpdj4gICAgPC9kaXY+ICAgIDxkaXYgY2xhc3M9XCJwYW5lbFwiPiAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIiAgZGF0YS1iaW5kPVwidGV4dDogJHJvb3QuZ2V0TG9jU3RyaW5nKFxcJ2V3LnRpdGxlSmF2YVNjcmlwdFxcJylcIj48L2Rpdj4gICAgICAgIDxkaXYgaWQ9XCJzdXJ2ZXlFbWJlZGluZ0phdmFcIiBzdHlsZT1cImhlaWdodDozMDBweDt3aWR0aDoxMDAlXCI+PC9kaXY+ICAgIDwvZGl2Pjwvc2NyaXB0Pic7fSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG5tb2R1bGUgdGVtcGxhdGVfcGFnZSB7IGV4cG9ydCB2YXIgaHRtbCA9ICc8ZGl2IGRhdGEtYmluZD1cImV2ZW50OnsgICAgICAgICAgIGRyYWdlbnRlcjpmdW5jdGlvbihlbCwgZSl7IGRyYWdFbnRlcihlKTt9LCAgICAgICAgICAgZHJhZ2xlYXZlOmZ1bmN0aW9uKGVsLCBlKXsgZHJhZ0xlYXZlKGUpO30sICAgICAgICAgICBkcmFnb3ZlcjpmdW5jdGlvbihlbCwgZSl7IHJldHVybiBmYWxzZTt9LCAgICAgICAgICAgZHJvcDpmdW5jdGlvbihlbCwgZSl7IGRyYWdEcm9wKGUpO319ICAgICBcIj4gICAgPGg0IGRhdGEtYmluZD1cInZpc2libGU6ICh0aXRsZS5sZW5ndGggPiAwKSAmJiBkYXRhLnNob3dQYWdlVGl0bGVzLCB0ZXh0OiBrb05vKCkgKyB0aXRsZVwiPjwvaDQ+ICAgIDwhLS0ga28gZm9yZWFjaDogeyBkYXRhOiBxdWVzdGlvbnMsIGFzOiBcXCdxdWVzdGlvblxcJyB9IC0tPiAgICA8ZGl2IGNsYXNzPVwic3ZkX2RyYWdvdmVyXCIgZGF0YS1iaW5kPVwidmlzaWJsZTokcGFyZW50LmtvRHJhZ2dpbmcoKSA9PSAkaW5kZXgoKVwiPjwvZGl2PiAgICA8IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6IFxcJ3N1cnZleS1xdWVzdGlvblxcJywgZGF0YTogcXVlc3Rpb24gfSAtLT4gICAgPCEtLSAva28gLS0+ICAgIDwhLS0gL2tvIC0tPiAgICA8ZGl2IGNsYXNzPVwid2VsbFwiIGRhdGEtYmluZD1cInZpc2libGU6JHJvb3QuaXNEZXNpZ25Nb2RlICYmIHF1ZXN0aW9ucy5sZW5ndGggPT0gMFwiPiAgICAgICAgPHNwYW4gZGF0YS1iaW5kPVwidGV4dDokcm9vdC5nZXRFZGl0b3JMb2NTdHJpbmcoXFwnc3VydmV5LmRyb3BRdWVzdGlvblxcJylcIj48L3NwYW4+ICAgIDwvZGl2PiAgICA8ZGl2IGNsYXNzPVwic3ZkX2RyYWdvdmVyXCIgZGF0YS1iaW5kPVwidmlzaWJsZTprb0RyYWdnaW5nKCkgPT0gcXVlc3Rpb25zLmxlbmd0aFwiPjwvZGl2PjwvZGl2Pic7fSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG5tb2R1bGUgdGVtcGxhdGVfcXVlc3Rpb24geyBleHBvcnQgdmFyIGh0bWwgPSAnPGRpdiBjbGFzcz1cIndlbGwgd2VsbC1zbVwiIGRhdGEtYmluZD1cInN0eWxlOiB7bWFyZ2luTGVmdDogcXVlc3Rpb24ua29NYXJnaW5MZWZ0IH0sICAgICAgYXR0ciA6IHtpZDogaWQsIGRyYWdnYWJsZTogJHJvb3QuaXNEZXNpZ25Nb2RlfSwgdmlzaWJsZTogcXVlc3Rpb24ua29WaXNpYmxlKCkgfHwgJHJvb3QuaXNEZXNpZ25Nb2RlLCBjbGljazogJHJvb3QuaXNEZXNpZ25Nb2RlID8ga29PbkNsaWNrOiBudWxsLCAgICAgICAgICBldmVudDp7ICAgICAgICAgICBkcmFnc3RhcnQ6ZnVuY3Rpb24oZWwsIGUpeyBkcmFnU3RhcnQoZSk7IHJldHVybiB0cnVlOyB9LCAgICAgICAgICAgZHJhZ292ZXI6ZnVuY3Rpb24oZWwsIGUpeyBkcmFnT3ZlcihlKTt9LCAgICAgICAgICAgZHJvcDpmdW5jdGlvbihlbCwgZSl7IGRyYWdEcm9wKGUpO30gICAgICAgICB9LCBjc3M6e3N2ZF9xX2Rlc2lnbl9ib3JkZXI6ICRyb290LmlzRGVzaWduTW9kZSwgc3ZkX3Ffc2VsZWN0ZWQgOiBrb0lzU2VsZWN0ZWR9XCI+ICAgIDxkaXYgY2xhc3M9XCJzdmRfcV9jb3B5YnV0dG9uXCIgZGF0YS1iaW5kPVwidmlzaWJsZToga29Jc1NlbGVjdGVkXCI+ICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi14c1wiIGRhdGEtYmluZD1cImNsaWNrOiAkcm9vdC5jb3B5UXVlc3Rpb25DbGljaywgdGV4dDokcm9vdC5nZXRFZGl0b3JMb2NTdHJpbmcoXFwnc3VydmV5LmNvcHlcXCcpXCI+PC9idXR0b24+ICAgIDwvZGl2PiAgICA8ZGl2IGRhdGEtYmluZD1cImNzczp7c3ZkX3FfZGVzaWduOiAkcm9vdC5pc0Rlc2lnbk1vZGV9XCI+ICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCIgZGF0YS1iaW5kPVwidmlzaWJsZToga29FcnJvcnMoKS5sZW5ndGggPiAwLCBmb3JlYWNoOiBrb0Vycm9yc1wiPiAgICAgICAgICAgIDxkaXY+ICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1leGNsYW1hdGlvbi1zaWduXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPiAgICAgICAgICAgICAgICA8c3BhbiBkYXRhLWJpbmQ9XCJ0ZXh0OiRkYXRhLmdldFRleHQoKVwiPjwvc3Bhbj4gICAgICAgICAgICA8L2Rpdj4gICAgICAgIDwvZGl2PiAgICAgICAgPCEtLSBrbyBpZjogcXVlc3Rpb24uaGFzVGl0bGUgLS0+ICAgICAgICA8aDUgZGF0YS1iaW5kPVwidGV4dDogcXVlc3Rpb24ua29UaXRsZSwgY3NzOiAkcm9vdC5jc3MucXVlc3Rpb24udGl0bGVcIj48L2g1PiAgICAgICAgPCEtLSAva28gLS0+ICAgICAgICA8IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6IFxcJ3N1cnZleS1xdWVzdGlvbi1cXCcgKyBxdWVzdGlvbi5nZXRUeXBlKCksIGRhdGE6IHF1ZXN0aW9uIH0gLS0+ICAgICAgICA8IS0tIC9rbyAtLT4gICAgICAgIDxkaXYgZGF0YS1iaW5kPVwidmlzaWJsZTogcXVlc3Rpb24uaGFzQ29tbWVudFwiPiAgICAgICAgICAgIDxkaXYgZGF0YS1iaW5kPVwidGV4dDpxdWVzdGlvbi5jb21tZW50VGV4dFwiPjwvZGl2PiAgICAgICAgICAgIDxkaXYgZGF0YS1iaW5kPVwidGVtcGxhdGU6IHsgbmFtZTogXFwnc3VydmV5LWNvbW1lbnRcXCcsIGRhdGE6IHtcXCdxdWVzdGlvblxcJzogcXVlc3Rpb24sIFxcJ3Zpc2libGVcXCc6IHRydWUgfSB9XCI+PC9kaXY+ICAgICAgICA8L2Rpdj4gICAgPC9kaXY+PC9kaXY+Jzt9IiwiLyohXG4qIHN1cnZleWpzIEVkaXRvciB2MC45LjEwXG4qIChjKSBBbmRyZXcgVGVsbm92IC0gaHR0cDovL3N1cnZleWpzLm9yZy9idWlsZGVyL1xuKiBHaXRodWIgLSBodHRwczovL2dpdGh1Yi5jb20vYW5kcmV3dGVsbm92L3N1cnZleS5qcy5lZGl0b3JcbiovXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJvYmplY3RFZGl0b3IudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicGFnZXNFZGl0b3IudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidGV4dFdvcmtlci50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJzdXJ2ZXlIZWxwZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwic3VydmV5RW1iZWRpbmdXaW5kb3cudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0VmVyYnMudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZHJhZ2Ryb3BoZWxwZXIudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidW5kb3JlZG8udHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidGVtcGxhdGVFZGl0b3Iua28uaHRtbC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0ZW1wbGF0ZV9wYWdlLmh0bWwudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidGVtcGxhdGVfcXVlc3Rpb24uaHRtbC50c1wiIC8+XHJcblxyXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlFZGl0b3Ige1xyXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlVGV4dFRpbWVvdXQ6IG51bWJlciA9IDEwMDA7XHJcbiAgICAgICAgcHVibGljIHN0YXRpYyBkZWZhdWx0TmV3U3VydmV5VGV4dDogc3RyaW5nID0gXCJ7IHBhZ2VzOiBbIHsgbmFtZTogJ3BhZ2UxJ31dIH1cIjtcclxuICAgICAgICBwcml2YXRlIHJlbmRlcmVkRWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzdXJ2ZXlqczogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBzdXJ2ZXlqc0V4YW1wbGU6IEhUTUxFbGVtZW50O1xyXG5cclxuICAgICAgICBwcml2YXRlIGpzb25FZGl0b3I6IEFjZUFqYXguRWRpdG9yO1xyXG4gICAgICAgIHByaXZhdGUgaXNQcm9jZXNzaW5nSW1tZWRpYXRlbHk6IGJvb2xlYW47XHJcbiAgICAgICAgcHJpdmF0ZSBzZWxlY3RlZE9iamVjdEVkaXRvcjogU3VydmV5T2JqZWN0RWRpdG9yO1xyXG4gICAgICAgIHByaXZhdGUgcGFnZXNFZGl0b3I6IFN1cnZleVBhZ2VzRWRpdG9yO1xyXG4gICAgICAgIHByaXZhdGUgc3VydmV5RW1iZWRpbmc6IFN1cnZleUVtYmVkaW5nV2luZG93XHJcbiAgICAgICAgcHJpdmF0ZSBzdXJ2ZXlPYmplY3RzOiBTdXJ2ZXlPYmplY3RzO1xyXG4gICAgICAgIHByaXZhdGUgc3VydmV5VmVyYnM6IFN1cnZleVZlcmJzO1xyXG4gICAgICAgIHByaXZhdGUgdGV4dFdvcmtlcjogU3VydmV5VGV4dFdvcmtlcjtcclxuICAgICAgICBwcml2YXRlIHVuZG9SZWRvOiBTdXJ2ZXlVbmRvUmVkbztcclxuICAgICAgICBwcml2YXRlIHN1cnZleVZhbHVlOiBTdXJ2ZXkuU3VydmV5O1xyXG4gICAgICAgIHByaXZhdGUgc2F2ZVN1cnZleUZ1bmNWYWx1ZTogKG5vOiBudW1iZXIsIG9uU2F2ZUNhbGxiYWNrOiAobm86IG51bWJlciwgaXNTdWNjZXNzOiBib29sZWFuKSA9PiB2b2lkKSA9PiB2b2lkO1xyXG4gICAgICAgIHByaXZhdGUgb3B0aW9uczogYW55O1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGVWYWx1ZTogc3RyaW5nID0gXCJcIjtcclxuXHJcbiAgICAgICAgcHVibGljIHN1cnZleUlkOiBzdHJpbmcgPSBudWxsO1xyXG4gICAgICAgIHB1YmxpYyBzdXJ2ZXlQb3N0SWQ6IHN0cmluZyA9IG51bGw7XHJcbiAgICAgICAgcHVibGljIHF1ZXN0aW9uVHlwZXM6IHN0cmluZ1tdO1xyXG4gICAgICAgIHB1YmxpYyBrb0NvcGllZFF1ZXN0aW9uczogYW55O1xyXG4gICAgICAgIHB1YmxpYyBnZW5lcmF0ZVZhbGlkSlNPTkNoYW5nZWRDYWxsYmFjazogKGdlbmVyYXRlVmFsaWRKU09OOiBib29sZWFuKSA9PiB2b2lkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGtvSXNTaG93RGVzaWduZXI6IGFueTtcclxuICAgICAgICBrb0NhbkRlbGV0ZU9iamVjdDogYW55O1xyXG4gICAgICAgIGtvT2JqZWN0czogYW55OyBrb1NlbGVjdGVkT2JqZWN0OiBhbnk7XHJcbiAgICAgICAga29TaG93U2F2ZUJ1dHRvbjogYW55O1xyXG4gICAgICAgIGtvR2VuZXJhdGVWYWxpZEpTT046IGFueTsga29TaG93T3B0aW9uczogYW55O1xyXG4gICAgICAgIHNlbGVjdERlc2lnbmVyQ2xpY2s6IGFueTsgc2VsZWN0RWRpdG9yQ2xpY2s6IGFueTtcclxuICAgICAgICBnZW5lcmF0ZVZhbGlkSlNPTkNsaWNrOiBhbnk7IGdlbmVyYXRlUmVhZGFibGVKU09OQ2xpY2s6IGFueTtcclxuICAgICAgICBkb1VuZG9DbGljazogYW55OyBkb1JlZG9DbGljazogYW55O1xyXG4gICAgICAgIGRlbGV0ZU9iamVjdENsaWNrOiBhbnk7XHJcbiAgICAgICAga29TdGF0ZTogYW55O1xyXG4gICAgICAgIHJ1blN1cnZleUNsaWNrOiBhbnk7IGVtYmVkaW5nU3VydmV5Q2xpY2s6IGFueTtcclxuICAgICAgICBzYXZlQnV0dG9uQ2xpY2s6IGFueTtcclxuICAgICAgICBkcmFnZ2luZ1F1ZXN0aW9uOiBhbnk7IGNsaWNrUXVlc3Rpb246IGFueTtcclxuICAgICAgICBkcmFnZ2luZ0NvcGllZFF1ZXN0aW9uOiBhbnk7IGNsaWNrQ29waWVkUXVlc3Rpb246IGFueTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocmVuZGVyZWRFbGVtZW50OiBhbnkgPSBudWxsLCBvcHRpb25zOiBhbnkgPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICAgICAgICAgIHRoaXMucXVlc3Rpb25UeXBlcyA9IHRoaXMuZ2V0UXVlc3Rpb25UeXBlcygpO1xyXG4gICAgICAgICAgICB0aGlzLmtvQ29waWVkUXVlc3Rpb25zID0ga28ub2JzZXJ2YWJsZUFycmF5KCk7XHJcbiAgICAgICAgICAgIHRoaXMua29DYW5EZWxldGVPYmplY3QgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHRoaXMua29TdGF0ZSA9IGtvLm9ic2VydmFibGUoKTtcclxuICAgICAgICAgICAgdGhpcy5rb1Nob3dTYXZlQnV0dG9uID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMua29TaG93T3B0aW9ucyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVCdXR0b25DbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5kb1NhdmUoKTsgfTtcclxuICAgICAgICAgICAgdGhpcy5rb09iamVjdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKTtcclxuICAgICAgICAgICAgdGhpcy5rb1NlbGVjdGVkT2JqZWN0ID0ga28ub2JzZXJ2YWJsZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWRPYmplY3Quc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkgeyBzZWxmLnNlbGVjdGVkT2JqZWN0Q2hhbmdlZChuZXdWYWx1ZSAhPSBudWxsID8gbmV3VmFsdWUudmFsdWUgOiBudWxsKTsgfSk7XHJcbiAgICAgICAgICAgIHRoaXMua29HZW5lcmF0ZVZhbGlkSlNPTiA9IGtvLm9ic2VydmFibGUodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5nZW5lcmF0ZVZhbGlkSlNPTik7XHJcbiAgICAgICAgICAgIHRoaXMua29HZW5lcmF0ZVZhbGlkSlNPTi5zdWJzY3JpYmUoZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYub3B0aW9ucykgc2VsZi5vcHRpb25zID0ge307XHJcbiAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMuZ2VuZXJhdGVWYWxpZEpTT04gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmdlbmVyYXRlVmFsaWRKU09OQ2hhbmdlZENhbGxiYWNrKSBzZWxmLmdlbmVyYXRlVmFsaWRKU09OQ2hhbmdlZENhbGxiYWNrKG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5T2JqZWN0cyA9IG5ldyBTdXJ2ZXlPYmplY3RzKHRoaXMua29PYmplY3RzLCB0aGlzLmtvU2VsZWN0ZWRPYmplY3QpO1xyXG4gICAgICAgICAgICB0aGlzLnVuZG9SZWRvID0gbmV3IFN1cnZleVVuZG9SZWRvKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZlcmJzID0gbmV3IFN1cnZleVZlcmJzKGZ1bmN0aW9uICgpIHsgc2VsZi5zZXRNb2RpZmllZCgpOyB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RFZGl0b3IgPSBuZXcgU3VydmV5T2JqZWN0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RFZGl0b3Iub25Qcm9wZXJ0eVZhbHVlQ2hhbmdlZC5hZGQoKHNlbmRlciwgb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vblByb3BlcnR5VmFsdWVDaGFuZ2VkKG9wdGlvbnMucHJvcGVydHksIG9wdGlvbnMub2JqZWN0LCBvcHRpb25zLm5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZXNFZGl0b3IgPSBuZXcgU3VydmV5UGFnZXNFZGl0b3IoKCkgPT4geyBzZWxmLmFkZFBhZ2UoKTsgfSwgKHBhZ2U6IFN1cnZleS5QYWdlKSA9PiB7IHNlbGYuc3VydmV5T2JqZWN0cy5zZWxlY3RPYmplY3QocGFnZSk7IH0sXHJcbiAgICAgICAgICAgICAgICAoaW5kZXhGcm9tOiBudW1iZXIsIGluZGV4VG86IG51bWJlcikgPT4geyBzZWxmLm1vdmVQYWdlKGluZGV4RnJvbSwgaW5kZXhUbyk7IH0sIChwYWdlOiBTdXJ2ZXkuUGFnZSkgPT4geyBzZWxmLmRlbGV0ZUN1cnJlbnRPYmplY3QoKTsgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5RW1iZWRpbmcgPSBuZXcgU3VydmV5RW1iZWRpbmdXaW5kb3coKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMua29Jc1Nob3dEZXNpZ25lciA9IGtvLm9ic2VydmFibGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0RGVzaWduZXJDbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5zaG93RGVzaWduZXIoKTsgfTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RFZGl0b3JDbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5zaG93SnNvbkVkaXRvcigpOyB9O1xyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlVmFsaWRKU09OQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYua29HZW5lcmF0ZVZhbGlkSlNPTih0cnVlKTsgfVxyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlUmVhZGFibGVKU09OQ2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYua29HZW5lcmF0ZVZhbGlkSlNPTihmYWxzZSk7IH1cclxuICAgICAgICAgICAgdGhpcy5ydW5TdXJ2ZXlDbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5zaG93TGl2ZVN1cnZleSgpOyB9O1xyXG4gICAgICAgICAgICB0aGlzLmVtYmVkaW5nU3VydmV5Q2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYuc2hvd1N1cnZleUVtYmVkaW5nKCk7IH07XHJcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlT2JqZWN0Q2xpY2sgPSBmdW5jdGlvbiAoKSB7IHNlbGYuZGVsZXRlQ3VycmVudE9iamVjdCgpOyB9O1xyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nUXVlc3Rpb24gPSBmdW5jdGlvbiAocXVlc3Rpb25UeXBlLCBlKSB7IHNlbGYuZG9EcmFnZ2luZ1F1ZXN0aW9uKHF1ZXN0aW9uVHlwZSwgZSk7IH1cclxuICAgICAgICAgICAgdGhpcy5jbGlja1F1ZXN0aW9uID0gZnVuY3Rpb24gKHF1ZXN0aW9uVHlwZSkgeyBzZWxmLmRvQ2xpY2tRdWVzdGlvbihxdWVzdGlvblR5cGUpOyB9XHJcbiAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmdDb3BpZWRRdWVzdGlvbiA9IGZ1bmN0aW9uIChpdGVtLCBlKSB7IHNlbGYuZG9EcmFnZ2luZ0NvcGllZFF1ZXN0aW9uKGl0ZW0uanNvbiwgZSk7IH1cclxuICAgICAgICAgICAgdGhpcy5jbGlja0NvcGllZFF1ZXN0aW9uID0gZnVuY3Rpb24gKGl0ZW0pIHsgc2VsZi5kb0NsaWNrQ29waWVkUXVlc3Rpb24oaXRlbS5qc29uKTsgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5kb1VuZG9DbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5kb1VuZG9SZWRvKHNlbGYudW5kb1JlZG8udW5kbygpKTsgfTtcclxuICAgICAgICAgICAgdGhpcy5kb1JlZG9DbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5kb1VuZG9SZWRvKHNlbGYudW5kb1JlZG8ucmVkbygpKTsgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZW5kZXJlZEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKHJlbmRlcmVkRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldCBzdXJ2ZXkoKTogU3VydmV5LlN1cnZleSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1cnZleVZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgcmVuZGVyKGVsZW1lbnQ6IGFueSA9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudCAmJiB0eXBlb2YgZWxlbWVudCA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZWRFbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5yZW5kZXJlZEVsZW1lbnQ7XHJcbiAgICAgICAgICAgIGlmICghZWxlbWVudCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHRlbXBsYXRlRWRpdG9yLmtvLmh0bWw7XHJcbiAgICAgICAgICAgIHNlbGYuYXBwbHlCaW5kaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBsb2FkU3VydmV5KHN1cnZleUlkOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBuZXcgU3VydmV5LmR4U3VydmV5U2VydmljZSgpLmxvYWRTdXJ2ZXkoc3VydmV5SWQsIGZ1bmN0aW9uIChzdWNjZXNzOiBib29sZWFuLCByZXN1bHQ6IHN0cmluZywgcmVzcG9uc2U6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MgJiYgcmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50ZXh0ID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgdGV4dCgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMua29Jc1Nob3dEZXNpZ25lcigpKSByZXR1cm4gdGhpcy5nZXRTdXJ2ZXlUZXh0RnJvbURlc2lnbmVyKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmpzb25FZGl0b3IgIT0gbnVsbCA/IHRoaXMuanNvbkVkaXRvci5nZXRWYWx1ZSgpIDogXCJcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHNldCB0ZXh0KHZhbHVlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy50ZXh0V29ya2VyID0gbmV3IFN1cnZleVRleHRXb3JrZXIodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0V29ya2VyLmlzSnNvbkNvcnJlY3QpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Rlc2lnbmVyKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFRleHRWYWx1ZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmtvSXNTaG93RGVzaWduZXIoZmFsc2UpOyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0IHN0YXRlKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnN0YXRlVmFsdWU7IH1cclxuICAgICAgICBwcm90ZWN0ZWQgc2V0U3RhdGUodmFsdWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlVmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5rb1N0YXRlKHRoaXMuc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzYXZlTm86IG51bWJlciA9IDA7XHJcbiAgICAgICAgcHJvdGVjdGVkIGRvU2F2ZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShcInNhdmluZ1wiKVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zYXZlU3VydmV5RnVuYykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlTm8rKztcclxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVN1cnZleUZ1bmModGhpcy5zYXZlTm8sXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZG9TYXZlQ2FsbGJhY2sobm86IG51bWJlciwgaXNTdWNjZXNzOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0U3RhdGUoXCJzYXZlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuc2F2ZU5vID09IG5vKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSBzZWxmLnNldFN0YXRlKFwic2F2ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2Vsc2UgVE9ET1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvdGVjdGVkIHNldE1vZGlmaWVkKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKFwibW9kaWZpZWRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VW5kb1JlZG9DdXJyZW50U3RhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzZXRVbmRvUmVkb0N1cnJlbnRTdGF0ZShjbGVhclN0YXRlOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICAgICAgaWYgKGNsZWFyU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudW5kb1JlZG8uY2xlYXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgc2VsT2JqID0gdGhpcy5rb1NlbGVjdGVkT2JqZWN0KCkgPyB0aGlzLmtvU2VsZWN0ZWRPYmplY3QoKS52YWx1ZSA6IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMudW5kb1JlZG8uc2V0Q3VycmVudCh0aGlzLnN1cnZleVZhbHVlLCBzZWxPYmogPyBzZWxPYmoubmFtZSA6IG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0IHNhdmVTdXJ2ZXlGdW5jKCkgeyByZXR1cm4gdGhpcy5zYXZlU3VydmV5RnVuY1ZhbHVlOyB9XHJcbiAgICAgICAgcHVibGljIHNldCBzYXZlU3VydmV5RnVuYyh2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN1cnZleUZ1bmNWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLmtvU2hvd1NhdmVCdXR0b24odmFsdWUgIT0gbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgc2hvd09wdGlvbnMoKSB7IHJldHVybiB0aGlzLmtvU2hvd09wdGlvbnMoKTsgfVxyXG4gICAgICAgIHB1YmxpYyBzZXQgc2hvd09wdGlvbnModmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5rb1Nob3dPcHRpb25zKHZhbHVlKTsgfVxyXG4gICAgICAgIHByaXZhdGUgc2V0VGV4dFZhbHVlKHZhbHVlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuanNvbkVkaXRvciA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuaXNQcm9jZXNzaW5nSW1tZWRpYXRlbHkgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmpzb25FZGl0b3Iuc2V0VmFsdWUodmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLmpzb25FZGl0b3IucmVuZGVyZXIudXBkYXRlRnVsbCh0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzSnNvbih2YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQcm9jZXNzaW5nSW1tZWRpYXRlbHkgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGFkZFBhZ2UoKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gU3VydmV5SGVscGVyLmdldE5ld1BhZ2VOYW1lKHRoaXMuc3VydmV5LnBhZ2VzKTtcclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSA8U3VydmV5LlBhZ2U+dGhpcy5zdXJ2ZXlWYWx1ZS5hZGROZXdQYWdlKG5hbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZFBhZ2VUb1VJKHBhZ2UpO1xyXG4gICAgICAgICAgICB0aGlzLnNldE1vZGlmaWVkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXRMb2NTdHJpbmcoc3RyOiBzdHJpbmcpIHsgcmV0dXJuIGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcoc3RyKTsgfVxyXG4gICAgICAgIHByb3RlY3RlZCBnZXRRdWVzdGlvblR5cGVzKCk6IHN0cmluZ1tdIHtcclxuICAgICAgICAgICAgdmFyIGFsbFR5cGVzID0gU3VydmV5LlF1ZXN0aW9uRmFjdG9yeS5JbnN0YW5jZS5nZXRBbGxUeXBlcygpO1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucyB8fCAhdGhpcy5vcHRpb25zLnF1ZXN0aW9uVHlwZXMgfHwgIXRoaXMub3B0aW9ucy5xdWVzdGlvblR5cGVzLmxlbmd0aCkgcmV0dXJuIGFsbFR5cGVzO1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLnF1ZXN0aW9uVHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBxdWVzdGlvblR5cGUgPSB0aGlzLm9wdGlvbnMucXVlc3Rpb25UeXBlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhbGxUeXBlcy5pbmRleE9mKHF1ZXN0aW9uVHlwZSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHF1ZXN0aW9uVHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBtb3ZlUGFnZShpbmRleEZyb206IG51bWJlciwgaW5kZXhUbzogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBwYWdlID0gPFN1cnZleS5QYWdlPnRoaXMuc3VydmV5LnBhZ2VzW2luZGV4RnJvbV07XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5LnBhZ2VzLnNwbGljZShpbmRleEZyb20sIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleS5wYWdlcy5zcGxpY2UoaW5kZXhUbywgMCwgcGFnZSk7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZXNFZGl0b3Iuc3VydmV5ID0gdGhpcy5zdXJ2ZXk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5T2JqZWN0cy5zZWxlY3RPYmplY3QocGFnZSlcclxuICAgICAgICAgICAgdGhpcy5zZXRNb2RpZmllZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGFkZFBhZ2VUb1VJKHBhZ2U6IFN1cnZleS5QYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFnZXNFZGl0b3Iuc3VydmV5ID0gdGhpcy5zdXJ2ZXlWYWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlPYmplY3RzLmFkZFBhZ2UocGFnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgb25RdWVzdGlvbkFkZGVkKHF1ZXN0aW9uOiBTdXJ2ZXkuUXVlc3Rpb25CYXNlKSB7XHJcbiAgICAgICAgICAgIHZhciBwYWdlID0gPFN1cnZleS5QYWdlPnRoaXMuc3VydmV5LmdldFBhZ2VCeVF1ZXN0aW9uKHF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlPYmplY3RzLmFkZFF1ZXN0aW9uKHBhZ2UsIHF1ZXN0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXkucmVuZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgb25RdWVzdGlvblJlbW92ZWQocXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlPYmplY3RzLnJlbW92ZU9iamVjdChxdWVzdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5LnJlbmRlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIG9uUHJvcGVydHlWYWx1ZUNoYW5nZWQocHJvcGVydHk6IFN1cnZleS5Kc29uT2JqZWN0UHJvcGVydHksIG9iajogYW55LCBuZXdWYWx1ZTogYW55KSB7XHJcbiAgICAgICAgICAgIHZhciBpc0RlZmF1bHQgPSBwcm9wZXJ0eS5pc0RlZmF1bHRWYWx1ZShuZXdWYWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialtwcm9wZXJ0eS5uYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PSBcIm5hbWVcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdXJ2ZXlPYmplY3RzLm5hbWVDaGFuZ2VkKG9iaik7XHJcbiAgICAgICAgICAgICAgICBpZiAoU3VydmV5SGVscGVyLmdldE9iamVjdFR5cGUob2JqKSA9PSBPYmpUeXBlLlBhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhZ2VzRWRpdG9yLmNoYW5nZU5hbWUoPFN1cnZleS5QYWdlPm9iaik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zZXRNb2RpZmllZCgpO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleS5yZW5kZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBkb1VuZG9SZWRvKGl0ZW06IFVuZG9SZWRvSXRlbSkge1xyXG4gICAgICAgICAgICB0aGlzLmluaXRTdXJ2ZXkoaXRlbS5zdXJ2ZXlKU09OKTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uc2VsZWN0ZWRPYmpOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsT2JqID0gdGhpcy5maW5kT2JqQnlOYW1lKGl0ZW0uc2VsZWN0ZWRPYmpOYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxPYmopIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1cnZleU9iamVjdHMuc2VsZWN0T2JqZWN0KHNlbE9iaik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBmaW5kT2JqQnlOYW1lKG5hbWU6IHN0cmluZyk6IFN1cnZleS5CYXNlIHtcclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSB0aGlzLnN1cnZleS5nZXRQYWdlQnlOYW1lKG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAocGFnZSkgcmV0dXJuIHBhZ2U7XHJcbiAgICAgICAgICAgIHZhciBxdWVzdGlvbiA9IDxTdXJ2ZXkuUXVlc3Rpb25CYXNlPnRoaXMuc3VydmV5LmdldFF1ZXN0aW9uQnlOYW1lKG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAocXVlc3Rpb24pIHJldHVybiBxdWVzdGlvbjtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgc2hvd0Rlc2lnbmVyKCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMudGV4dFdvcmtlci5pc0pzb25Db3JyZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydCh0aGlzLmdldExvY1N0cmluZyhcImVkLmNvcnJlY3RKU09OXCIpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmluaXRTdXJ2ZXkobmV3IFN1cnZleS5Kc29uT2JqZWN0KCkudG9Kc29uT2JqZWN0KHRoaXMudGV4dFdvcmtlci5zdXJ2ZXkpKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRVbmRvUmVkb0N1cnJlbnRTdGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5rb0lzU2hvd0Rlc2lnbmVyKHRydWUpOyBcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzaG93SnNvbkVkaXRvcigpIHtcclxuICAgICAgICAgICAgdGhpcy5qc29uRWRpdG9yLnNldFZhbHVlKHRoaXMuZ2V0U3VydmV5VGV4dEZyb21EZXNpZ25lcigpKTtcclxuICAgICAgICAgICAgdGhpcy5qc29uRWRpdG9yLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIHRoaXMua29Jc1Nob3dEZXNpZ25lcihmYWxzZSk7IFxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFN1cnZleVRleHRGcm9tRGVzaWduZXIoKSB7XHJcbiAgICAgICAgICAgIHZhciBqc29uID0gbmV3IFN1cnZleS5Kc29uT2JqZWN0KCkudG9Kc29uT2JqZWN0KHRoaXMuc3VydmV5KTtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuZ2VuZXJhdGVWYWxpZEpTT04pIHJldHVybiBKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdXJ2ZXlKU09ONSgpLnN0cmluZ2lmeShqc29uLCBudWxsLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzZWxlY3RlZE9iamVjdENoYW5nZWQob2JqOiBTdXJ2ZXkuQmFzZSkge1xyXG4gICAgICAgICAgICB2YXIgY2FuRGVsZXRlT2JqZWN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RFZGl0b3Iuc2VsZWN0ZWRPYmplY3QgPSBvYmo7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5VmVyYnMub2JqID0gb2JqO1xyXG4gICAgICAgICAgICB2YXIgb2JqVHlwZSA9IFN1cnZleUhlbHBlci5nZXRPYmplY3RUeXBlKG9iaik7XHJcbiAgICAgICAgICAgIGlmIChvYmpUeXBlID09IE9ialR5cGUuUGFnZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdXJ2ZXkuY3VycmVudFBhZ2UgPSA8U3VydmV5LlBhZ2U+b2JqO1xyXG4gICAgICAgICAgICAgICAgY2FuRGVsZXRlT2JqZWN0ID0gdGhpcy5zdXJ2ZXkucGFnZXMubGVuZ3RoID4gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob2JqVHlwZSA9PSBPYmpUeXBlLlF1ZXN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleVtcInNldHNlbGVjdGVkUXVlc3Rpb25cIl0ob2JqKTtcclxuICAgICAgICAgICAgICAgIGNhbkRlbGV0ZU9iamVjdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleS5jdXJyZW50UGFnZSA9IHRoaXMuc3VydmV5LmdldFBhZ2VCeVF1ZXN0aW9uKHRoaXMuc3VydmV5W1wic2VsZWN0ZWRRdWVzdGlvblZhbHVlXCJdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3VydmV5W1wic2V0c2VsZWN0ZWRRdWVzdGlvblwiXShudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmtvQ2FuRGVsZXRlT2JqZWN0KGNhbkRlbGV0ZU9iamVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgYXBwbHlCaW5kaW5nKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZW5kZXJlZEVsZW1lbnQgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBrby5jbGVhbk5vZGUodGhpcy5yZW5kZXJlZEVsZW1lbnQpO1xyXG4gICAgICAgICAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMsIHRoaXMucmVuZGVyZWRFbGVtZW50KTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlqcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3VydmV5anNcIik7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleWpzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleWpzLm9ua2V5ZG93biA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSA0Nikgc2VsZi5kZWxldGVRdWVzdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmtleUNvZGUgPT0gMzggfHwgZS5rZXlDb2RlID09IDQwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2VsZWN0UXVlc3Rpb24oZS5rZXlDb2RlID09IDM4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuanNvbkVkaXRvciA9IGFjZS5lZGl0KFwic3VydmV5anNFZGl0b3JcIik7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5anNFeGFtcGxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdXJ2ZXlqc0V4YW1wbGVcIik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRTdXJ2ZXkobmV3IFN1cnZleUpTT041KCkucGFyc2UoU3VydmV5RWRpdG9yLmRlZmF1bHROZXdTdXJ2ZXlUZXh0KSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VW5kb1JlZG9DdXJyZW50U3RhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5VmFsdWUubW9kZSA9IFwiZGVzaWduZXJcIjtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlWYWx1ZS5yZW5kZXIodGhpcy5zdXJ2ZXlqcyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRKc29uRWRpdG9yKCk7XHJcbiAgICAgICAgICAgIFN1cnZleVRleHRXb3JrZXIubmV3TGluZUNoYXIgPSB0aGlzLmpzb25FZGl0b3Iuc2Vzc2lvbi5kb2MuZ2V0TmV3TGluZUNoYXJhY3RlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGluaXRKc29uRWRpdG9yKCkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuanNvbkVkaXRvci5zZXRUaGVtZShcImFjZS90aGVtZS9tb25va2FpXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmpzb25FZGl0b3Iuc2Vzc2lvbi5zZXRNb2RlKFwiYWNlL21vZGUvanNvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5qc29uRWRpdG9yLnNldFNob3dQcmludE1hcmdpbihmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuanNvbkVkaXRvci5nZXRTZXNzaW9uKCkub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vbkpzb25FZGl0b3JDaGFuZ2VkKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmpzb25FZGl0b3IuZ2V0U2Vzc2lvbigpLnNldFVzZVdvcmtlcih0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBpbml0U3VydmV5KGpzb246IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlID0gbmV3IFN1cnZleS5TdXJ2ZXkoanNvbik7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleVZhbHVlLmlzRW1wdHkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3VydmV5VmFsdWUgPSBuZXcgU3VydmV5LlN1cnZleShuZXcgU3VydmV5SlNPTjUoKS5wYXJzZShTdXJ2ZXlFZGl0b3IuZGVmYXVsdE5ld1N1cnZleVRleHQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnN1cnZleS5tb2RlID0gXCJkZXNpZ25lclwiO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleS5yZW5kZXIodGhpcy5zdXJ2ZXlqcyk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5T2JqZWN0cy5zdXJ2ZXkgPSB0aGlzLnN1cnZleTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlc0VkaXRvci5zdXJ2ZXkgPSB0aGlzLnN1cnZleTtcclxuICAgICAgICAgICAgdGhpcy5wYWdlc0VkaXRvci5zZXRTZWxlY3RlZFBhZ2UoPFN1cnZleS5QYWdlPnRoaXMuc3VydmV5LmN1cnJlbnRQYWdlKTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlWZXJicy5zdXJ2ZXkgPSB0aGlzLnN1cnZleTtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlW1wib25TZWxlY3RlZFF1ZXN0aW9uQ2hhbmdlZFwiXS5hZGQoKHNlbmRlcjogU3VydmV5LlN1cnZleSwgb3B0aW9ucykgPT4geyBzZWxmLnN1cnZleU9iamVjdHMuc2VsZWN0T2JqZWN0KHNlbmRlcltcInNlbGVjdGVkUXVlc3Rpb25WYWx1ZVwiXSk7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlW1wib25Db3B5UXVlc3Rpb25cIl0uYWRkKChzZW5kZXI6IFN1cnZleS5TdXJ2ZXksIG9wdGlvbnMpID0+IHsgc2VsZi5jb3B5UXVlc3Rpb24oc2VsZi5rb1NlbGVjdGVkT2JqZWN0KCkudmFsdWUpOyB9KTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlWYWx1ZVtcIm9uQ3JlYXRlRHJhZ0Ryb3BIZWxwZXJcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLmNyZWF0ZURyYWdEcm9wSGVscGVyKCkgfTtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlWYWx1ZS5vblByb2Nlc3NIdG1sLmFkZCgoc2VuZGVyOiBTdXJ2ZXkuU3VydmV5LCBvcHRpb25zKSA9PiB7IG9wdGlvbnMuaHRtbCA9IHNlbGYucHJvY2Vzc0h0bWwob3B0aW9ucy5odG1sKTsgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5VmFsdWUub25DdXJyZW50UGFnZUNoYW5nZWQuYWRkKChzZW5kZXI6IFN1cnZleS5TdXJ2ZXksIG9wdGlvbnMpID0+IHsgc2VsZi5wYWdlc0VkaXRvci5zZXRTZWxlY3RlZFBhZ2UoPFN1cnZleS5QYWdlPnNlbmRlci5jdXJyZW50UGFnZSk7IH0pO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlLm9uUXVlc3Rpb25BZGRlZC5hZGQoKHNlbmRlcjogU3VydmV5LlN1cnZleSwgb3B0aW9ucykgPT4geyBzZWxmLm9uUXVlc3Rpb25BZGRlZChvcHRpb25zLnF1ZXN0aW9uKTsgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5VmFsdWUub25RdWVzdGlvblJlbW92ZWQuYWRkKChzZW5kZXI6IFN1cnZleS5TdXJ2ZXksIG9wdGlvbnMpID0+IHsgc2VsZi5vblF1ZXN0aW9uUmVtb3ZlZChvcHRpb25zLnF1ZXN0aW9uKTsgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgcHJvY2Vzc0h0bWwoaHRtbDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgaWYgKCFodG1sKSByZXR1cm4gaHRtbDtcclxuICAgICAgICAgICAgdmFyIHNjcmlwdFJlZ0V4ID0gLzxzY3JpcHRcXGJbXjxdKig/Oig/ITxcXC9zY3JpcHQ+KTxbXjxdKikqPFxcL3NjcmlwdD4vZ2k7XHJcbiAgICAgICAgICAgIHdoaWxlIChzY3JpcHRSZWdFeC50ZXN0KGh0bWwpKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKHNjcmlwdFJlZ0V4LCBcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSB0aW1lb3V0SWQ6IG51bWJlciA9IC0xO1xyXG4gICAgICAgIHByaXZhdGUgb25Kc29uRWRpdG9yQ2hhbmdlZCgpOiBhbnkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0SWQgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkKTtcclxuICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1Byb2Nlc3NpbmdJbW1lZGlhdGVseSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0SWQgPSAtMTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aW1lb3V0SWQgPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnByb2Nlc3NKc29uKHNlbGYudGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9LCBTdXJ2ZXlFZGl0b3IudXBkYXRlVGV4dFRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgcHJvY2Vzc0pzb24odGV4dDogc3RyaW5nKTogYW55IHtcclxuICAgICAgICAgICAgdGhpcy50ZXh0V29ya2VyID0gbmV3IFN1cnZleVRleHRXb3JrZXIodGV4dCk7XHJcbiAgICAgICAgICAgIHRoaXMuanNvbkVkaXRvci5nZXRTZXNzaW9uKCkuc2V0QW5ub3RhdGlvbnModGhpcy5jcmVhdGVBbm5vdGF0aW9ucyh0ZXh0LCB0aGlzLnRleHRXb3JrZXIuZXJyb3JzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZG9EcmFnZ2luZ1F1ZXN0aW9uKHF1ZXN0aW9uVHlwZTogYW55LCBlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlRHJhZ0Ryb3BIZWxwZXIoKS5zdGFydERyYWdOZXdRdWVzdGlvbihlLCBxdWVzdGlvblR5cGUsIHRoaXMuZ2V0TmV3UXVlc3Rpb25OYW1lKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGRvRHJhZ2dpbmdDb3BpZWRRdWVzdGlvbihqc29uOiBhbnksIGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVEcmFnRHJvcEhlbHBlcigpLnN0YXJ0RHJhZ0NvcGllZFF1ZXN0aW9uKGUsIHRoaXMuZ2V0TmV3UXVlc3Rpb25OYW1lKCksIGpzb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGNyZWF0ZURyYWdEcm9wSGVscGVyKCk6IERyYWdEcm9wSGVscGVyIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IERyYWdEcm9wSGVscGVyKDxTdXJ2ZXkuSVN1cnZleT50aGlzLnN1cnZleSwgZnVuY3Rpb24gKCkgeyBzZWxmLnNldE1vZGlmaWVkKCkgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZG9DbGlja1F1ZXN0aW9uKHF1ZXN0aW9uVHlwZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9DbGlja1F1ZXN0aW9uQ29yZShTdXJ2ZXkuUXVlc3Rpb25GYWN0b3J5Lkluc3RhbmNlLmNyZWF0ZVF1ZXN0aW9uKHF1ZXN0aW9uVHlwZSwgdGhpcy5nZXROZXdRdWVzdGlvbk5hbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGRvQ2xpY2tDb3BpZWRRdWVzdGlvbihqc29uOiBhbnkpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLmdldE5ld1F1ZXN0aW9uTmFtZSgpO1xyXG4gICAgICAgICAgICB2YXIgcXVlc3Rpb24gPSBTdXJ2ZXkuUXVlc3Rpb25GYWN0b3J5Lkluc3RhbmNlLmNyZWF0ZVF1ZXN0aW9uKGpzb25bXCJ0eXBlXCJdLCBuYW1lKTtcclxuICAgICAgICAgICAgbmV3IFN1cnZleS5Kc29uT2JqZWN0KCkudG9PYmplY3QoanNvbiwgcXVlc3Rpb24pO1xyXG4gICAgICAgICAgICBxdWVzdGlvbi5uYW1lID0gbmFtZTtcclxuICAgICAgICAgICAgdGhpcy5kb0NsaWNrUXVlc3Rpb25Db3JlKHF1ZXN0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBnZXROZXdRdWVzdGlvbk5hbWUoKTogc3RyaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIFN1cnZleUhlbHBlci5nZXROZXdRdWVzdGlvbk5hbWUodGhpcy5zdXJ2ZXkuZ2V0QWxsUXVlc3Rpb25zKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGRvQ2xpY2tRdWVzdGlvbkNvcmUocXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UpIHtcclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSB0aGlzLnN1cnZleS5jdXJyZW50UGFnZTtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleVtcInNlbGVjdGVkUXVlc3Rpb25WYWx1ZVwiXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IHBhZ2UucXVlc3Rpb25zLmluZGV4T2YodGhpcy5zdXJ2ZXlbXCJzZWxlY3RlZFF1ZXN0aW9uVmFsdWVcIl0pICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYWdlLmFkZFF1ZXN0aW9uKHF1ZXN0aW9uLCBpbmRleCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0TW9kaWZpZWQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBkZWxldGVRdWVzdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHF1ZXN0aW9uID0gdGhpcy5nZXRTZWxlY3RlZE9iakFzUXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgaWYgKHF1ZXN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZUN1cnJlbnRPYmplY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHNlbGVjdFF1ZXN0aW9uKGlzVXA6IGJvb2xlYW4pIHtcclxuICAgICAgICAgICAgdmFyIHF1ZXN0aW9uID0gdGhpcy5nZXRTZWxlY3RlZE9iakFzUXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgaWYgKHF1ZXN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleU9iamVjdHMuc2VsZWN0TmV4dFF1ZXN0aW9uKGlzVXApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBnZXRTZWxlY3RlZE9iakFzUXVlc3Rpb24oKTogU3VydmV5LlF1ZXN0aW9uQmFzZSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSB0aGlzLmtvU2VsZWN0ZWRPYmplY3QoKS52YWx1ZTtcclxuICAgICAgICAgICAgaWYgKCFvYmopIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gU3VydmV5SGVscGVyLmdldE9iamVjdFR5cGUob2JqKSA9PSBPYmpUeXBlLlF1ZXN0aW9uID8gPFN1cnZleS5RdWVzdGlvbkJhc2U+KG9iaik6IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZGVsZXRlQ3VycmVudE9iamVjdCgpIHtcclxuICAgICAgICAgICAgdGhpcy5kZWxldGVPYmplY3QodGhpcy5rb1NlbGVjdGVkT2JqZWN0KCkudmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgY29weVF1ZXN0aW9uKHF1ZXN0aW9uOiBTdXJ2ZXkuUXVlc3Rpb25CYXNlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmpUeXBlID0gU3VydmV5SGVscGVyLmdldE9iamVjdFR5cGUocXVlc3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAob2JqVHlwZSAhPSBPYmpUeXBlLlF1ZXN0aW9uKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBqc29uID0gbmV3IFN1cnZleS5Kc29uT2JqZWN0KCkudG9Kc29uT2JqZWN0KHF1ZXN0aW9uKTtcclxuICAgICAgICAgICAganNvbi50eXBlID0gcXVlc3Rpb24uZ2V0VHlwZSgpO1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IHRoaXMuZ2V0Q29waWVkUXVlc3Rpb25CeU5hbWUocXVlc3Rpb24ubmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmpzb24gPSBqc29uO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rb0NvcGllZFF1ZXN0aW9ucy5wdXNoKHsgbmFtZTogcXVlc3Rpb24ubmFtZSwganNvbjoganNvbiB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5rb0NvcGllZFF1ZXN0aW9ucygpLmxlbmd0aCA+IDMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMua29Db3BpZWRRdWVzdGlvbnMuc3BsaWNlKDAsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0Q29waWVkUXVlc3Rpb25CeU5hbWUobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IHRoaXMua29Db3BpZWRRdWVzdGlvbnMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zW2ldLm5hbWUgPT0gbmFtZSkgcmV0dXJuIGl0ZW1zW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGRlbGV0ZU9iamVjdChvYmo6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleU9iamVjdHMucmVtb3ZlT2JqZWN0KG9iaik7XHJcbiAgICAgICAgICAgIHZhciBvYmpUeXBlID0gU3VydmV5SGVscGVyLmdldE9iamVjdFR5cGUob2JqKTtcclxuICAgICAgICAgICAgaWYgKG9ialR5cGUgPT0gT2JqVHlwZS5QYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleS5yZW1vdmVQYWdlKG9iaik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhZ2VzRWRpdG9yLnJlbW92ZVBhZ2Uob2JqKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0TW9kaWZpZWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob2JqVHlwZSA9PSBPYmpUeXBlLlF1ZXN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleS5jdXJyZW50UGFnZS5yZW1vdmVRdWVzdGlvbihvYmopO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdXJ2ZXlbXCJzZXRzZWxlY3RlZFF1ZXN0aW9uXCJdKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdXJ2ZXlPYmplY3RzLnNlbGVjdE9iamVjdCh0aGlzLnN1cnZleS5jdXJyZW50UGFnZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldE1vZGlmaWVkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXkucmVuZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgc2hvd0xpdmVTdXJ2ZXkoKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5zdXJ2ZXlqc0V4YW1wbGUpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIGpzb24gPSB0aGlzLmdldFN1cnZleUpTT04oKTtcclxuICAgICAgICAgICAgaWYgKGpzb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGpzb24uY29va2llTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBqc29uLmNvb2tpZU5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgc3VydmV5ID0gbmV3IFN1cnZleS5TdXJ2ZXkoanNvbik7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3VydmV5anNFeGFtcGxlUmVzdWx0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3VydmV5anNFeGFtcGxlUmVzdWx0c1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdXJ2ZXlqc0V4YW1wbGVSZXN1bHRzKSBzdXJ2ZXlqc0V4YW1wbGVSZXN1bHRzLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBzdXJ2ZXkub25Db21wbGV0ZS5hZGQoKHNlbmRlcjogU3VydmV5LlN1cnZleSkgPT4geyBpZiAoc3VydmV5anNFeGFtcGxlUmVzdWx0cykgc3VydmV5anNFeGFtcGxlUmVzdWx0cy5pbm5lckhUTUwgPSB0aGlzLmdldExvY1N0cmluZyhcImVkLnN1cnZleVJlc3VsdHNcIikgKyBKU09OLnN0cmluZ2lmeShzdXJ2ZXkuZGF0YSk7IH0pO1xyXG4gICAgICAgICAgICAgICAgc3VydmV5LnJlbmRlcih0aGlzLnN1cnZleWpzRXhhbXBsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1cnZleWpzRXhhbXBsZS5pbm5lckhUTUwgPSB0aGlzLmdldExvY1N0cmluZyhcImVkLmNvcnJlY3RKU09OXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgc2hvd1N1cnZleUVtYmVkaW5nKCkge1xyXG4gICAgICAgICAgICB2YXIganNvbiA9IHRoaXMuZ2V0U3VydmV5SlNPTigpO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nLmpzb24gPSBqc29uO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleUVtYmVkaW5nLnN1cnZleUlkID0gdGhpcy5zdXJ2ZXlJZDtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlFbWJlZGluZy5zdXJ2ZXlQb3N0SWQgPSB0aGlzLnN1cnZleVBvc3RJZDtcclxuICAgICAgICAgICAgdGhpcy5zdXJ2ZXlFbWJlZGluZy5nZW5lcmF0ZVZhbGlkSlNPTiA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuZ2VuZXJhdGVWYWxpZEpTT047XHJcbiAgICAgICAgICAgIHRoaXMuc3VydmV5RW1iZWRpbmcuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFN1cnZleUpTT04oKTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMua29Jc1Nob3dEZXNpZ25lcigpKSAgcmV0dXJuIG5ldyBTdXJ2ZXkuSnNvbk9iamVjdCgpLnRvSnNvbk9iamVjdCh0aGlzLnN1cnZleSk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRleHRXb3JrZXIuaXNKc29uQ29ycmVjdCkgcmV0dXJuIG5ldyBTdXJ2ZXkuSnNvbk9iamVjdCgpLnRvSnNvbk9iamVjdCh0aGlzLnRleHRXb3JrZXIuc3VydmV5KTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgY3JlYXRlQW5ub3RhdGlvbnModGV4dDogc3RyaW5nLCBlcnJvcnM6IGFueVtdKTogQWNlQWpheC5Bbm5vdGF0aW9uW10ge1xyXG4gICAgICAgICAgICB2YXIgYW5ub3RhdGlvbnMgPSBuZXcgQXJyYXk8QWNlQWpheC5Bbm5vdGF0aW9uPigpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVycm9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yID0gZXJyb3JzW2ldO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFubm90YXRpb246IEFjZUFqYXguQW5ub3RhdGlvbiA9IHsgcm93OiBlcnJvci5wb3NpdGlvbi5zdGFydC5yb3csIGNvbHVtbjogZXJyb3IucG9zaXRpb24uc3RhcnQuY29sdW1uLCB0ZXh0OiBlcnJvci50ZXh0LCB0eXBlOiBcImVycm9yXCIgfTtcclxuICAgICAgICAgICAgICAgIGFubm90YXRpb25zLnB1c2goYW5ub3RhdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb25zO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBuZXcgU3VydmV5LlN1cnZleVRlbXBsYXRlVGV4dCgpLnJlcGxhY2VUZXh0KHRlbXBsYXRlX3BhZ2UuaHRtbCwgXCJwYWdlXCIpO1xyXG4gICAgbmV3IFN1cnZleS5TdXJ2ZXlUZW1wbGF0ZVRleHQoKS5yZXBsYWNlVGV4dCh0ZW1wbGF0ZV9xdWVzdGlvbi5odG1sLCBcInF1ZXN0aW9uXCIpO1xyXG5cclxuICAgIFN1cnZleS5TdXJ2ZXkucHJvdG90eXBlW1wib25DcmVhdGluZ1wiXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkUXVlc3Rpb25WYWx1ZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5vblNlbGVjdGVkUXVlc3Rpb25DaGFuZ2VkID0gbmV3IFN1cnZleS5FdmVudDwoc2VuZGVyOiBTdXJ2ZXkuU3VydmV5LCBvcHRpb25zOiBhbnkpID0+IGFueSwgYW55PigpO1xyXG4gICAgICAgIHRoaXMub25Db3B5UXVlc3Rpb24gPSBuZXcgU3VydmV5LkV2ZW50PChzZW5kZXI6IFN1cnZleS5TdXJ2ZXksIG9wdGlvbnM6IGFueSkgPT4gYW55LCBhbnk+KCk7XHJcbiAgICAgICAgdGhpcy5vbkNyZWF0ZURyYWdEcm9wSGVscGVyID0gbnVsbDtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5jb3B5UXVlc3Rpb25DbGljayA9IGZ1bmN0aW9uICgpIHsgc2VsZi5vbkNvcHlRdWVzdGlvbi5maXJlKHNlbGYpOyB9O1xyXG4gICAgfVxyXG4gICAgU3VydmV5LlN1cnZleS5wcm90b3R5cGVbXCJzZXRzZWxlY3RlZFF1ZXN0aW9uXCJdID0gZnVuY3Rpb24odmFsdWU6IFN1cnZleS5RdWVzdGlvbkJhc2UpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gdGhpcy5zZWxlY3RlZFF1ZXN0aW9uVmFsdWUpIHJldHVybjtcclxuICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLnNlbGVjdGVkUXVlc3Rpb25WYWx1ZTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkUXVlc3Rpb25WYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIGlmIChvbGRWYWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIG9sZFZhbHVlW1wib25TZWxlY3RlZFF1ZXN0aW9uQ2hhbmdlZFwiXSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFF1ZXN0aW9uVmFsdWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUXVlc3Rpb25WYWx1ZVtcIm9uU2VsZWN0ZWRRdWVzdGlvbkNoYW5nZWRcIl0oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vblNlbGVjdGVkUXVlc3Rpb25DaGFuZ2VkLmZpcmUodGhpcywgeyAnb2xkU2VsZWN0ZWRRdWVzdGlvbic6IG9sZFZhbHVlLCAnbmV3U2VsZWN0ZWRRdWVzdGlvbic6IHZhbHVlIH0pO1xyXG4gICAgfVxyXG4gICAgU3VydmV5LlN1cnZleS5wcm90b3R5cGVbXCJnZXRFZGl0b3JMb2NTdHJpbmdcIl0gPSBmdW5jdGlvbiAodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIGVkaXRvckxvY2FsaXphdGlvbi5nZXRTdHJpbmcodmFsdWUpO1xyXG4gICAgfVxyXG4gICAgU3VydmV5LlBhZ2UucHJvdG90eXBlW1wib25DcmVhdGluZ1wiXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5kcmFnRW50ZXJDb3VudGVyID0gMDtcclxuICAgICAgICB0aGlzLmtvRHJhZ2dpbmcgPSBrby5vYnNlcnZhYmxlKC0xKTtcclxuICAgICAgICB0aGlzLmtvRHJhZ2dpbmcuc3Vic2NyaWJlKGZ1bmN0aW9uIChuZXdWYWx1ZSkgeyBpZiAobmV3VmFsdWUgPCAwKSBzZWxmLmRyYWdFbnRlckNvdW50ZXIgPSAwOyB9KTtcclxuICAgICAgICB0aGlzLmRyYWdFbnRlciA9IGZ1bmN0aW9uIChlKSB7IGUucHJldmVudERlZmF1bHQoKTsgc2VsZi5kcmFnRW50ZXJDb3VudGVyKys7IHNlbGYuZG9EcmFnRW50ZXIoZSk7IH07XHJcbiAgICAgICAgdGhpcy5kcmFnTGVhdmUgPSBmdW5jdGlvbiAoZSkgeyBzZWxmLmRyYWdFbnRlckNvdW50ZXItLTsgaWYgKHNlbGYuZHJhZ0VudGVyQ291bnRlciA9PT0gMCkgc2VsZi5rb0RyYWdnaW5nKC0xKTsgfTtcclxuICAgICAgICB0aGlzLmRyYWdEcm9wID0gZnVuY3Rpb24gKGUpIHsgc2VsZi5kb0Ryb3AoZSk7IH07XHJcbiAgICB9XHJcbiAgICBTdXJ2ZXkuUGFnZS5wcm90b3R5cGVbXCJkb0Ryb3BcIl0gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciBkcmFnRHJvcEhlbHBlciA9IHRoaXMuZGF0YVtcIm9uQ3JlYXRlRHJhZ0Ryb3BIZWxwZXJcIl0gPyB0aGlzLmRhdGFbXCJvbkNyZWF0ZURyYWdEcm9wSGVscGVyXCJdKCkgOiBuZXcgRHJhZ0Ryb3BIZWxwZXIodGhpcy5kYXRhLCBudWxsKTtcclxuICAgICAgICBkcmFnRHJvcEhlbHBlci5kb0Ryb3AoZSk7XHJcbiAgICB9XHJcbiAgICBTdXJ2ZXkuUGFnZS5wcm90b3R5cGVbXCJkb0RyYWdFbnRlclwiXSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAodGhpcy5xdWVzdGlvbnMubGVuZ3RoID4gMCB8fCB0aGlzLmtvRHJhZ2dpbmcoKSA+IDApIHJldHVybjtcclxuICAgICAgICBpZiAobmV3IERyYWdEcm9wSGVscGVyKHRoaXMuZGF0YSwgbnVsbCkuaXNTdXJ2ZXlEcmFnZ2luZyhlKSkge1xyXG4gICAgICAgICAgICB0aGlzLmtvRHJhZ2dpbmcodGhpcy5xdWVzdGlvbnMubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgU3VydmV5LlF1ZXN0aW9uQmFzZS5wcm90b3R5cGVbXCJvbkNyZWF0aW5nXCJdID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICB0aGlzLmRyYWdEcm9wSGVscGVyVmFsdWUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuZHJhZ0Ryb3BIZWxwZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxmLmRyYWdEcm9wSGVscGVyVmFsdWUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5kcmFnRHJvcEhlbHBlclZhbHVlID0gc2VsZi5kYXRhW1wib25DcmVhdGVEcmFnRHJvcEhlbHBlclwiXSA/IHNlbGYuZGF0YVtcIm9uQ3JlYXRlRHJhZ0Ryb3BIZWxwZXJcIl0oKSA6IG5ldyBEcmFnRHJvcEhlbHBlcihzZWxmLmRhdGEsIG51bGwpOztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2VsZi5kcmFnRHJvcEhlbHBlclZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRyYWdPdmVyID0gZnVuY3Rpb24gKGUpIHsgc2VsZi5kcmFnRHJvcEhlbHBlcigpLmRvRHJhZ0Ryb3BPdmVyKGUsIHNlbGYpOyB9XHJcbiAgICAgICAgdGhpcy5kcmFnRHJvcCA9IGZ1bmN0aW9uIChlKSB7IHNlbGYuZHJhZ0Ryb3BIZWxwZXIoKS5kb0Ryb3AoZSwgc2VsZik7IH1cclxuICAgICAgICB0aGlzLmRyYWdTdGFydCA9IGZ1bmN0aW9uIChlKSB7IHNlbGYuZHJhZ0Ryb3BIZWxwZXIoKS5zdGFydERyYWdRdWVzdGlvbihlLCBzZWxmLm5hbWUpOyB9XHJcbiAgICAgICAgdGhpcy5rb0lzU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgICAgICB0aGlzLmtvT25DbGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGYuZGF0YSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgICAgIHNlbGYuZGF0YVtcInNldHNlbGVjdGVkUXVlc3Rpb25cIl0odGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgU3VydmV5LlF1ZXN0aW9uQmFzZS5wcm90b3R5cGVbXCJvblNlbGVjdGVkUXVlc3Rpb25DaGFuZ2VkXCJdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5rb0lzU2VsZWN0ZWQodGhpcy5kYXRhW1wic2VsZWN0ZWRRdWVzdGlvblZhbHVlXCJdID09IHRoaXMpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuICAgIGV4cG9ydCB2YXIgZWRpdG9yTG9jYWxpemF0aW9uID0ge1xyXG4gICAgICAgIGN1cnJlbnRMb2NhbGU6IFwiXCIsXHJcbiAgICAgICAgbG9jYWxlczoge30sXHJcbiAgICAgICAgZ2V0U3RyaW5nOiBmdW5jdGlvbiAoc3RyTmFtZTogc3RyaW5nLCBsb2NhbGU6IHN0cmluZyA9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKCFsb2NhbGUpIGxvY2FsZSA9IHRoaXMuY3VycmVudExvY2FsZTtcclxuICAgICAgICAgICAgdmFyIGxvYyA9IGxvY2FsZSA/IHRoaXMubG9jYWxlc1t0aGlzLmN1cnJlbnRMb2NhbGVdIDogZGVmYXVsdFN0cmluZ3M7XHJcbiAgICAgICAgICAgIGlmICghbG9jKSBsb2MgPSBkZWZhdWx0U3RyaW5ncztcclxuICAgICAgICAgICAgdmFyIHBhdGggPSBzdHJOYW1lLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsb2M7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgb2JqID0gb2JqW3BhdGhbaV1dO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jID09PSBkZWZhdWx0U3RyaW5ncykgcmV0dXJuIHBhdGhbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RyaW5nKHN0ck5hbWUsIFwiZW5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldFByb3BlcnR5TmFtZTogZnVuY3Rpb24gKHN0ck5hbWU6IHN0cmluZywgbG9jYWw6IHN0cmluZyA9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHRoaXMuZ2V0UHJvcGVydHkoc3RyTmFtZSwgbG9jYWwpO1xyXG4gICAgICAgICAgICBpZiAob2JqW1wibmFtZVwiXSkgcmV0dXJuIG9ialtcIm5hbWVcIl07XHJcbiAgICAgICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRQcm9wZXJ0eVRpdGxlOiBmdW5jdGlvbiAoc3RyTmFtZTogc3RyaW5nLCBsb2NhbDogc3RyaW5nID0gbnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gdGhpcy5nZXRQcm9wZXJ0eShzdHJOYW1lLCBsb2NhbCk7XHJcbiAgICAgICAgICAgIGlmIChvYmpbXCJ0aXRsZVwiXSkgcmV0dXJuIG9ialtcInRpdGxlXCJdO1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldFByb3BlcnR5OiBmdW5jdGlvbiAoc3RyTmFtZTogc3RyaW5nLCBsb2NhbDogc3RyaW5nID0gbnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gdGhpcy5nZXRTdHJpbmcoXCJwLlwiICsgc3RyTmFtZSwgbG9jYWwpO1xyXG4gICAgICAgICAgICBpZiAob2JqICE9PSBzdHJOYW1lKSByZXR1cm4gb2JqO1xyXG4gICAgICAgICAgICB2YXIgcG9zID0gc3RyTmFtZS5pbmRleE9mKCdfJyk7XHJcbiAgICAgICAgICAgIGlmIChwb3MgPCAtMSkgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgc3RyTmFtZSA9IHN0ck5hbWUuc3Vic3RyKHBvcyArIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTdHJpbmcoXCJwLlwiICsgc3RyTmFtZSwgbG9jYWwpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0TG9jYWxlczogZnVuY3Rpb24gKCk6IEFycmF5PHN0cmluZz4ge1xyXG4gICAgICAgICAgICB2YXIgcmVzID0gW107XHJcbiAgICAgICAgICAgIHJlcy5wdXNoKFwiXCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5sb2NhbGVzKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIGV4cG9ydCB2YXIgZGVmYXVsdFN0cmluZ3MgPSB7XHJcbiAgICAgICAgLy9zdXJ2ZXkgdGVtcGxhdGVzXHJcbiAgICAgICAgc3VydmV5OiB7XHJcbiAgICAgICAgICAgIGRyb3BRdWVzdGlvbjogXCJQbGVhc2UgZHJvcCBhIHF1ZXN0aW9uIGhlcmUuXCIsXHJcbiAgICAgICAgICAgIGNvcHk6IFwiQ29weVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL3F1ZXN0aW9uVHlwZXNcclxuICAgICAgICBxdDoge1xyXG4gICAgICAgICAgICBjaGVja2JveDogXCJDaGVja2JveFwiLFxyXG4gICAgICAgICAgICBjb21tZW50OiBcIkNvbW1lbnRcIixcclxuICAgICAgICAgICAgZHJvcGRvd246IFwiRHJvcGRvd25cIixcclxuICAgICAgICAgICAgZmlsZTogXCJGaWxlXCIsXHJcbiAgICAgICAgICAgIGh0bWw6IFwiSHRtbFwiLFxyXG4gICAgICAgICAgICBtYXRyaXg6IFwiTWF0cml4IChzaW5nbGUgY2hvaWNlKVwiLFxyXG4gICAgICAgICAgICBtYXRyaXhkcm9wZG93bjogXCJNYXRyaXggKG11bHRpcGxlIGNob2ljZSlcIixcclxuICAgICAgICAgICAgbWF0cml4ZHluYW1pYzogXCJNYXRyaXggKGR5bmFtaWMgcm93cylcIixcclxuICAgICAgICAgICAgbXVsdGlwbGV0ZXh0OiBcIk11bHRpcGxlIFRleHRcIixcclxuICAgICAgICAgICAgcmFkaW9ncm91cDogXCJSYWRpb2dyb3VwXCIsXHJcbiAgICAgICAgICAgIHJhdGluZzogXCJSYXRpbmdcIixcclxuICAgICAgICAgICAgdGV4dDogXCJUZXh0XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vU3RyaW5ncyBpbiBFZGl0b3JcclxuICAgICAgICBlZDoge1xyXG4gICAgICAgICAgICBuZXdQYWdlTmFtZTogXCJwYWdlXCIsXHJcbiAgICAgICAgICAgIG5ld1F1ZXN0aW9uTmFtZTogXCJxdWVzdGlvblwiLFxyXG4gICAgICAgICAgICBydW5TdXJ2ZXk6IFwiIFJ1biBTdXJ2ZXlcIixcclxuICAgICAgICAgICAgZW1iZWRTdXJ2ZXk6IFwiRW1iZWQgU3VydmV5XCIsXHJcbiAgICAgICAgICAgIHNhdmVTdXJ2ZXk6IFwiU2F2ZSBTdXJ2ZXlcIixcclxuICAgICAgICAgICAgZGVzaWduZXI6IFwiRGVzaWduZXJcIixcclxuICAgICAgICAgICAganNvbkVkaXRvcjogXCJKU09OIEVkaXRvclwiLFxyXG4gICAgICAgICAgICB1bmRvOiBcIlVuZG9cIixcclxuICAgICAgICAgICAgcmVkbzogXCJSZWRvXCIsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IFwiT3B0aW9uc1wiLFxyXG4gICAgICAgICAgICBnZW5lcmF0ZVZhbGlkSlNPTjogXCJHZW5lcmF0ZSBWYWxpZCBKU09OXCIsXHJcbiAgICAgICAgICAgIGdlbmVyYXRlUmVhZGFibGVKU09OOiBcIkdlbmVyYXRlIFJlYWRhYmxlIEpTT05cIixcclxuICAgICAgICAgICAgdG9vbGJveDogXCJUb29sYm94XCIsXHJcbiAgICAgICAgICAgIGRlbFNlbE9iamVjdDogXCJEZWxldGUgc2VsZWN0ZWQgb2JqZWN0XCIsXHJcbiAgICAgICAgICAgIGNvcnJlY3RKU09OOiBcIlBsZWFzZSBjb3JyZWN0IEpTT04uXCIsXHJcbiAgICAgICAgICAgIHN1cnZleVJlc3VsdHM6IFwiU3VydmV5IFJlc3VsdDogXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vUHJvcGVydHkgRWRpdG9yc1xyXG4gICAgICAgIHBlOiB7XHJcbiAgICAgICAgICAgIGFwcGx5OiBcIkFwcGx5XCIsXHJcbiAgICAgICAgICAgIGNsb3NlOiBcIkNsb3NlXCIsXHJcbiAgICAgICAgICAgIGRlbGV0ZTogXCJEZWxldGVcIixcclxuICAgICAgICAgICAgYWRkTmV3OiBcIkFkZCBOZXdcIixcclxuICAgICAgICAgICAgcmVtb3ZlQWxsOiBcIlJlbW92ZSBBbGxcIixcclxuICAgICAgICAgICAgZWRpdDogXCJFZGl0XCIsXHJcblxyXG4gICAgICAgICAgICB2YWx1ZTogXCJWYWx1ZVwiLFxyXG4gICAgICAgICAgICB0ZXh0OiBcIlRleHRcIixcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFwiUmVxdWlyZWQ/XCIsXHJcbiAgICAgICAgICAgIGhhc090aGVyOiBcIkhhcyBPdGhlciBJdGVtXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiTmFtZVwiLFxyXG4gICAgICAgICAgICB0aXRsZTogXCJUaXRsZVwiLFxyXG4gICAgICAgICAgICBjZWxsVHlwZTogXCJDZWxsIFR5cGVcIixcclxuICAgICAgICAgICAgY29sQ291bnQ6IFwiQ29sdW1uIENvdW50XCIsXHJcblxyXG4gICAgICAgICAgICBlZGl0UHJvcGVydHk6IFwiRWRpdCBwcm9wZXJ0eSAnezB9J1wiLFxyXG4gICAgICAgICAgICBpdGVtczogXCJbIEl0ZW1zOiB7MH0gXVwiLFxyXG5cclxuICAgICAgICAgICAgZW50ZXJOZXdWYWx1ZTogXCJQbGVhc2UsIGVudGVyIHRoZSB2YWx1ZS5cIixcclxuICAgICAgICAgICAgbm9xdWVzdGlvbnM6IFwiVGhlcmUgaXMgbm8gYW55IHF1ZXN0aW9uIGluIHRoZSBzdXJ2ZXkuXCIsXHJcbiAgICAgICAgICAgIGNyZWF0ZXRyaWdnZXI6IFwiUGxlYXNlIGNyZWF0ZSBhIHRyaWdnZXJcIixcclxuICAgICAgICAgICAgdHJpZ2dlck9uOiBcIk9uIFwiLFxyXG4gICAgICAgICAgICB0cmlnZ2VyTWFrZVBhZ2VzVmlzaWJsZTogXCJNYWtlIHBhZ2VzIHZpc2libGU6XCIsXHJcbiAgICAgICAgICAgIHRyaWdnZXJNYWtlUXVlc3Rpb25zVmlzaWJsZTogXCJNYWtlIHF1ZXN0aW9ucyB2aXNpYmxlOlwiLFxyXG4gICAgICAgICAgICB0cmlnZ2VyQ29tcGxldGVUZXh0OiBcIkNvbXBsZXRlIHRoZSBzdXJ2ZXkgaWYgc3VjY2VlZC5cIixcclxuICAgICAgICAgICAgdHJpZ2dlck5vdFNldDogXCJUaGUgdHJpZ2dlciBpcyBub3Qgc2V0XCIsXHJcbiAgICAgICAgICAgIHRyaWdnZXJSdW5JZjogXCJSdW4gaWZcIixcclxuICAgICAgICAgICAgdHJpZ2dlclNldFRvTmFtZTogXCJDaGFuZ2UgdmFsdWUgb2Y6IFwiLFxyXG4gICAgICAgICAgICB0cmlnZ2VyU2V0VmFsdWU6IFwidG86IFwiLFxyXG4gICAgICAgICAgICB0cmlnZ2VySXNWYXJpYWJsZTogXCJEbyBub3QgcHV0IHRoZSB2YXJpYWJsZSBpbnRvIHRoZSBzdXJ2ZXkgcmVzdWx0LlwiLFxyXG4gICAgICAgICAgICB2ZXJiQ2hhbmdlVHlwZTogXCJDaGFuZ2UgdHlwZSBcIixcclxuICAgICAgICAgICAgdmVyYkNoYW5nZVBhZ2U6IFwiQ2hhbmdlIHBhZ2UgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vT3BlcmF0b3JzXHJcbiAgICAgICAgb3A6IHtcclxuICAgICAgICAgICAgZW1wdHk6IFwiaXMgZW1wdHlcIixcclxuICAgICAgICAgICAgbm90ZW1wdHk6IFwiaXMgbm90IGVtcHR5XCIsXHJcbiAgICAgICAgICAgIGVxdWFsOiBcImVxdWFsc1wiLFxyXG4gICAgICAgICAgICBub3RlcXVhbDogXCJub3QgZXF1YWxzXCIsXHJcbiAgICAgICAgICAgIGNvbnRhaW5zOiBcImNvbnRhaW5zXCIsIFxyXG4gICAgICAgICAgICBub3Rjb250YWluczogXCJub3QgY29udGFpbnNcIixcclxuICAgICAgICAgICAgZ3JlYXRlcjogXCJncmVhdGVyXCIsIFxyXG4gICAgICAgICAgICBsZXNzOiBcImxlc3NcIixcclxuICAgICAgICAgICAgZ3JlYXRlcm9yZXF1YWw6IFwiZ3JlYXRlciBvciBlcXVhbHNcIiwgXHJcbiAgICAgICAgICAgIGxlc3NvcmVxdWFsOiBcIkxlc3Mgb3IgRXF1YWxzXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vRW1iZWQgd2luZG93XHJcbiAgICAgICAgZXc6IHtcclxuICAgICAgICAgICAga25vY2tvdXQ6IFwiVXNlIEtub2Nrb3V0IHZlcnNpb25cIixcclxuICAgICAgICAgICAgcmVhY3Q6IFwiVXNlIFJlYWN0IHZlcnNpb25cIixcclxuICAgICAgICAgICAgYm9vdHN0cmFwOiBcIkZvciBib290c3RyYXAgZnJhbWV3b3JrXCIsXHJcbiAgICAgICAgICAgIHN0YW5kYXJkOiBcIk5vIGJvb3RzdHJhcFwiLFxyXG4gICAgICAgICAgICBzaG93T25QYWdlOiBcIlNob3cgc3VydmV5IG9uIGEgcGFnZVwiLFxyXG4gICAgICAgICAgICBzaG93SW5XaW5kb3c6IFwiU2hvdyBzdXJ2ZXkgaW4gYSB3aW5kb3dcIixcclxuICAgICAgICAgICAgbG9hZEZyb21TZXJ2ZXI6IFwiTG9hZCBTdXJ2ZXkgSlNPTiBmcm9tIHNlcnZlclwiLFxyXG4gICAgICAgICAgICB0aXRsZVNjcmlwdDogXCJTY3JpcHRzIGFuZCBzdHlsZXNcIixcclxuICAgICAgICAgICAgdGl0bGVIdG1sOiBcIkhUTUxcIixcclxuICAgICAgICAgICAgdGl0bGVKYXZhU2NyaXB0OiBcIkphdmFTY3JpcHRcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy9Qcm9wZXJ0aWVzXHJcbiAgICAgICAgcDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIm5hbWVcIixcclxuICAgICAgICAgICAgdGl0bGU6IHsgbmFtZTogXCJ0aXRsZVwiLCB0aXRsZTogXCJMZWF2ZSBpdCBlbXB0eSwgaWYgaXQgaXMgdGhlIHNhbWUgYXMgJ05hbWUnXCIgfSxcclxuICAgICAgICAgICAgc3VydmV5X3RpdGxlOiB7IG5hbWU6IFwidGl0bGVcIiwgdGl0bGU6IFwiSXQgd2lsbCBiZSBzaG93biBvbiBldmVyeSBwYWdlLlwiIH0sXHJcbiAgICAgICAgICAgIHBhZ2VfdGl0bGU6IHsgbmFtZTogXCJ0aXRsZVwiLCB0aXRsZTogXCJQYWdlIHRpdGxlXCIgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVkaXRvckxvY2FsaXphdGlvbi5sb2NhbGVzW1wiZW5cIl0gPSBkZWZhdWx0U3RyaW5ncztcclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG4vLyBUaGlzIGZpbGUgaXMgYmFzZWQgb24gSlNPTjUsIGh0dHA6Ly9qc29uNS5vcmcvXHJcbi8vIFRoZSBtb2RpZmljYXRpb24gZm9yIGdldHRpbmcgb2JqZWN0IGFuZCBwcm9wZXJ0aWVzIGxvY2F0aW9uICdhdCcgd2VyZSBtYWRlbi5cclxuXHJcbm1vZHVsZSBTdXJ2ZXlFZGl0b3Ige1xyXG4gICAgZXhwb3J0IGNsYXNzIFN1cnZleUpTT041IHtcclxuICAgICAgICBwdWJsaWMgc3RhdGljIHBvc2l0aW9uTmFtZSA9IFwicG9zXCI7XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgZXNjYXBlZSA9IHtcclxuICAgICAgICAgICAgXCInXCI6IFwiJ1wiLFxyXG4gICAgICAgICAgICAnXCInOiAnXCInLFxyXG4gICAgICAgICAgICAnXFxcXCc6ICdcXFxcJyxcclxuICAgICAgICAgICAgJy8nOiAnLycsXHJcbiAgICAgICAgICAgICdcXG4nOiAnJywgICAgICAgLy8gUmVwbGFjZSBlc2NhcGVkIG5ld2xpbmVzIGluIHN0cmluZ3Mgdy8gZW1wdHkgc3RyaW5nXHJcbiAgICAgICAgICAgIGI6ICdcXGInLFxyXG4gICAgICAgICAgICBmOiAnXFxmJyxcclxuICAgICAgICAgICAgbjogJ1xcbicsXHJcbiAgICAgICAgICAgIHI6ICdcXHInLFxyXG4gICAgICAgICAgICB0OiAnXFx0J1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgd3MgPSBbXHJcbiAgICAgICAgICAgICcgJyxcclxuICAgICAgICAgICAgJ1xcdCcsXHJcbiAgICAgICAgICAgICdcXHInLFxyXG4gICAgICAgICAgICAnXFxuJyxcclxuICAgICAgICAgICAgJ1xcdicsXHJcbiAgICAgICAgICAgICdcXGYnLFxyXG4gICAgICAgICAgICAnXFx4QTAnLFxyXG4gICAgICAgICAgICAnXFx1RkVGRidcclxuICAgICAgICBdO1xyXG4gICAgICAgIHByaXZhdGUgZW5kQXQ6IG51bWJlcjtcclxuICAgICAgICBwcml2YXRlIGF0OiBudW1iZXI7ICAgICAvLyBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2hhcmFjdGVyXHJcbiAgICAgICAgcHJpdmF0ZSBjaDogYW55OyAgICAgLy8gVGhlIGN1cnJlbnQgY2hhcmFjdGVyXHJcbiAgICAgICAgcHJpdmF0ZSB0ZXh0OiBzdHJpbmc7XHJcbiAgICAgICAgcHJpdmF0ZSBwYXJzZVR5cGU6IG51bWJlcjsgLy8gMCAtIHN0YWRhcmQsIDEgLSBnZXQgaW5mb3JtYXRpb24gYWJvdXQgb2JqZWN0cywgMiAtIGdldCBpbmZvcm1hdGlvbiBhYm91dCBhbGwgcHJvcGVydGllc1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHBhcnNlVHlwZTogbnVtYmVyID0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcnNlVHlwZSA9IHBhcnNlVHlwZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHBhcnNlKHNvdXJjZTogYW55LCByZXZpdmVyOiBhbnkgPSBudWxsLCBzdGFydEZyb206IG51bWJlciA9IDAsIGVuZEF0OiBudW1iZXIgPSAtMSk6IGFueSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRleHQgPSBTdHJpbmcoc291cmNlKTtcclxuICAgICAgICAgICAgdGhpcy5hdCA9IHN0YXJ0RnJvbTtcclxuICAgICAgICAgICAgdGhpcy5lbmRBdCA9IGVuZEF0O1xyXG4gICAgICAgICAgICB0aGlzLmNoID0gJyAnO1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLnZhbHVlKCk7XHJcbiAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2gpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoXCJTeW50YXggZXJyb3JcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgcmV2aXZlciBmdW5jdGlvbiwgd2UgcmVjdXJzaXZlbHkgd2FsayB0aGUgbmV3IHN0cnVjdHVyZSxcclxuICAgICAgICAgICAgLy8gcGFzc2luZyBlYWNoIG5hbWUvdmFsdWUgcGFpciB0byB0aGUgcmV2aXZlciBmdW5jdGlvbiBmb3IgcG9zc2libGVcclxuICAgICAgICAgICAgLy8gdHJhbnNmb3JtYXRpb24sIHN0YXJ0aW5nIHdpdGggYSB0ZW1wb3Jhcnkgcm9vdCBvYmplY3QgdGhhdCBob2xkcyB0aGUgcmVzdWx0XHJcbiAgICAgICAgICAgIC8vIGluIGFuIGVtcHR5IGtleS4gSWYgdGhlcmUgaXMgbm90IGEgcmV2aXZlciBmdW5jdGlvbiwgd2Ugc2ltcGx5IHJldHVybiB0aGVcclxuICAgICAgICAgICAgLy8gcmVzdWx0LlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiByZXZpdmVyID09PSAnZnVuY3Rpb24nID8gKGZ1bmN0aW9uIHdhbGsoaG9sZGVyLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgPSB3YWxrKHZhbHVlLCBrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtrXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXZpdmVyLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfSAoeyAnJzogcmVzdWx0IH0sICcnKSkgOiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZXJyb3IobTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGwgZXJyb3Igd2hlbiBzb21ldGhpbmcgaXMgd3JvbmcuXHJcbiAgICAgICAgICAgIHZhciBlcnJvciA9IG5ldyBTeW50YXhFcnJvcigpO1xyXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gbTtcclxuICAgICAgICAgICAgZXJyb3JbXCJhdFwiXSA9IHRoaXMuYXQ7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIG5leHQoYzogYW55ID0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBJZiBhIGMgcGFyYW1ldGVyIGlzIHByb3ZpZGVkLCB2ZXJpZnkgdGhhdCBpdCBtYXRjaGVzIHRoZSBjdXJyZW50IGNoYXJhY3Rlci5cclxuICAgICAgICAgICAgaWYgKGMgJiYgYyAhPT0gdGhpcy5jaCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcihcIkV4cGVjdGVkICdcIiArIGMgKyBcIicgaW5zdGVhZCBvZiAnXCIgKyB0aGlzLmNoICsgXCInXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgdGhpcy5uZXh0IGNoYXJhY3Rlci4gV2hlbiB0aGVyZSBhcmUgbm8gbW9yZSBjaGFyYWN0ZXJzLFxyXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIGVtcHR5IHN0cmluZy5cclxuICAgICAgICAgICAgdGhpcy5jaCA9IHRoaXMuY2hhcnRBdCgpO1xyXG4gICAgICAgICAgICB0aGlzLmF0ICs9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHBlZWsoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgdGhpcy5uZXh0IGNoYXJhY3RlciB3aXRob3V0IGNvbnN1bWluZyBpdCBvclxyXG4gICAgICAgICAgICAvLyBhc3NpZ25pbmcgaXQgdG8gdGhlIHRoaXMuY2ggdmFyYWlibGUuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNoYXJ0QXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBjaGFydEF0KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lbmRBdCA+IC0xICYmIHRoaXMuYXQgPj0gdGhpcy5lbmRBdCkgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0LmNoYXJBdCh0aGlzLmF0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBpZGVudGlmaWVyKCkge1xyXG4gICAgICAgICAgICAvLyBQYXJzZSBhbiBpZGVudGlmaWVyLiBOb3JtYWxseSwgcmVzZXJ2ZWQgd29yZHMgYXJlIGRpc2FsbG93ZWQgaGVyZSwgYnV0IHdlXHJcbiAgICAgICAgICAgIC8vIG9ubHkgdXNlIHRoaXMgZm9yIHVucXVvdGVkIG9iamVjdCBrZXlzLCB3aGVyZSByZXNlcnZlZCB3b3JkcyBhcmUgYWxsb3dlZCxcclxuICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgY2hlY2sgZm9yIHRob3NlIGhlcmUuIFJlZmVyZW5jZXM6XHJcbiAgICAgICAgICAgIC8vIC0gaHR0cDovL2VzNS5naXRodWIuY29tLyN4Ny42XHJcbiAgICAgICAgICAgIC8vIC0gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ29yZV9KYXZhU2NyaXB0XzEuNV9HdWlkZS9Db3JlX0xhbmd1YWdlX0ZlYXR1cmVzI1ZhcmlhYmxlc1xyXG4gICAgICAgICAgICAvLyAtIGh0dHA6Ly9kb2NzdG9yZS5taWsudWEvb3JlbGx5L3dlYnByb2cvanNjcmlwdC9jaDAyXzA3Lmh0bVxyXG4gICAgICAgICAgICAvLyBUT0RPIElkZW50aWZpZXJzIGNhbiBoYXZlIFVuaWNvZGUgXCJsZXR0ZXJzXCIgaW4gdGhlbTsgYWRkIHN1cHBvcnQgZm9yIHRob3NlLlxyXG4gICAgICAgICAgICB2YXIga2V5ID0gdGhpcy5jaDtcclxuXHJcbiAgICAgICAgICAgIC8vIElkZW50aWZpZXJzIG11c3Qgc3RhcnQgd2l0aCBhIGxldHRlciwgXyBvciAkLlxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuY2ggIT09ICdfJyAmJiB0aGlzLmNoICE9PSAnJCcpICYmXHJcbiAgICAgICAgICAgICAgICAodGhpcy5jaCA8ICdhJyB8fCB0aGlzLmNoID4gJ3onKSAmJlxyXG4gICAgICAgICAgICAgICAgKHRoaXMuY2ggPCAnQScgfHwgdGhpcy5jaCA+ICdaJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoXCJCYWQgaWRlbnRpZmllclwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU3Vic2VxdWVudCBjaGFyYWN0ZXJzIGNhbiBjb250YWluIGRpZ2l0cy5cclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMubmV4dCgpICYmIChcclxuICAgICAgICAgICAgICAgIHRoaXMuY2ggPT09ICdfJyB8fCB0aGlzLmNoID09PSAnJCcgfHxcclxuICAgICAgICAgICAgICAgICh0aGlzLmNoID49ICdhJyAmJiB0aGlzLmNoIDw9ICd6JykgfHxcclxuICAgICAgICAgICAgICAgICh0aGlzLmNoID49ICdBJyAmJiB0aGlzLmNoIDw9ICdaJykgfHxcclxuICAgICAgICAgICAgICAgICh0aGlzLmNoID49ICcwJyAmJiB0aGlzLmNoIDw9ICc5JykpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgKz0gdGhpcy5jaDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGtleTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBudW1iZXIoKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBQYXJzZSBhIG51bWJlciB2YWx1ZS5cclxuXHJcbiAgICAgICAgICAgIHZhciBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICBzaWduID0gJycsXHJcbiAgICAgICAgICAgICAgICBzdHJpbmcgPSAnJyxcclxuICAgICAgICAgICAgICAgIGJhc2UgPSAxMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAnLScgfHwgdGhpcy5jaCA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgICAgICBzaWduID0gdGhpcy5jaDtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCh0aGlzLmNoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc3VwcG9ydCBmb3IgSW5maW5pdHkgKGNvdWxkIHR3ZWFrIHRvIGFsbG93IG90aGVyIHdvcmRzKTpcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICdJJykge1xyXG4gICAgICAgICAgICAgICAgbnVtYmVyID0gdGhpcy53b3JkKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG51bWJlciAhPT0gJ251bWJlcicgfHwgaXNOYU4obnVtYmVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoJ1VuZXhwZWN0ZWQgd29yZCBmb3IgbnVtYmVyJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHNpZ24gPT09ICctJykgPyAtbnVtYmVyIDogbnVtYmVyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBOYU5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICdOJykge1xyXG4gICAgICAgICAgICAgICAgbnVtYmVyID0gdGhpcy53b3JkKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKG51bWJlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yKCdleHBlY3RlZCB3b3JkIHRvIGJlIE5hTicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gaWdub3JlIHNpZ24gYXMgLU5hTiBhbHNvIGlzIE5hTlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICcwJykge1xyXG4gICAgICAgICAgICAgICAgc3RyaW5nICs9IHRoaXMuY2g7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAneCcgfHwgdGhpcy5jaCA9PT0gJ1gnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9IHRoaXMuY2g7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFzZSA9IDE2O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNoID49ICcwJyAmJiB0aGlzLmNoIDw9ICc5Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoJ09jdGFsIGxpdGVyYWwnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChiYXNlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwOlxyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNoID49ICcwJyAmJiB0aGlzLmNoIDw9ICc5Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gdGhpcy5jaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAnLicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9ICcuJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMubmV4dCgpICYmIHRoaXMuY2ggPj0gJzAnICYmIHRoaXMuY2ggPD0gJzknKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gdGhpcy5jaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaCA9PT0gJ2UnIHx8IHRoaXMuY2ggPT09ICdFJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gdGhpcy5jaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAnLScgfHwgdGhpcy5jaCA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gdGhpcy5jaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNoID49ICcwJyAmJiB0aGlzLmNoIDw9ICc5Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9IHRoaXMuY2g7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMTY6XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuY2ggPj0gJzAnICYmIHRoaXMuY2ggPD0gJzknIHx8IHRoaXMuY2ggPj0gJ0EnICYmIHRoaXMuY2ggPD0gJ0YnIHx8IHRoaXMuY2ggPj0gJ2EnICYmIHRoaXMuY2ggPD0gJ2YnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSB0aGlzLmNoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaWduID09PSAnLScpIHtcclxuICAgICAgICAgICAgICAgIG51bWJlciA9IC1zdHJpbmc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBudW1iZXIgPSArc3RyaW5nO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlKG51bWJlcikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoXCJCYWQgbnVtYmVyXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHN0cmluZygpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFBhcnNlIGEgc3RyaW5nIHZhbHVlLlxyXG5cclxuICAgICAgICAgICAgdmFyIGhleCxcclxuICAgICAgICAgICAgICAgIGksXHJcbiAgICAgICAgICAgICAgICBzdHJpbmcgPSAnJyxcclxuICAgICAgICAgICAgICAgIGRlbGltLCAgICAgIC8vIGRvdWJsZSBxdW90ZSBvciBzaW5nbGUgcXVvdGVcclxuICAgICAgICAgICAgICAgIHVmZmZmO1xyXG5cclxuICAgICAgICAgICAgLy8gV2hlbiBwYXJzaW5nIGZvciBzdHJpbmcgdmFsdWVzLCB3ZSBtdXN0IGxvb2sgZm9yICcgb3IgXCIgYW5kIFxcIGNoYXJhY3RlcnMuXHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jaCA9PT0gJ1wiJyB8fCB0aGlzLmNoID09PSBcIidcIikge1xyXG4gICAgICAgICAgICAgICAgZGVsaW0gPSB0aGlzLmNoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMubmV4dCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09IGRlbGltKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaCA9PT0gJ1xcXFwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaCA9PT0gJ3UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGV4ID0gcGFyc2VJbnQodGhpcy5uZXh0KCksIDE2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluaXRlKGhleCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVmZmZmID0gdWZmZmYgKiAxNiArIGhleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHVmZmZmKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNoID09PSAnXFxyJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucGVlaygpID09PSAnXFxuJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBTdXJ2ZXlKU09ONS5lc2NhcGVlW3RoaXMuY2hdID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9IFN1cnZleUpTT041LmVzY2FwZWVbdGhpcy5jaF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaCA9PT0gJ1xcbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5lc2NhcGVkIG5ld2xpbmVzIGFyZSBpbnZhbGlkOyBzZWU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hc2VlbWsvanNvbjUvaXNzdWVzLzI0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gdGhpcyBmZWVscyBzcGVjaWFsLWNhc2VkOyBhcmUgdGhlcmUgb3RoZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW52YWxpZCB1bmVzY2FwZWQgY2hhcnM/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSB0aGlzLmNoO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVycm9yKFwiQmFkIHN0cmluZ1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBpbmxpbmVDb21tZW50KCkge1xyXG5cclxuICAgICAgICAgICAgLy8gU2tpcCBhbiBpbmxpbmUgY29tbWVudCwgYXNzdW1pbmcgdGhpcyBpcyBvbmUuIFRoZSBjdXJyZW50IGNoYXJhY3RlciBzaG91bGRcclxuICAgICAgICAgICAgLy8gYmUgdGhlIHNlY29uZCAvIGNoYXJhY3RlciBpbiB0aGUgLy8gcGFpciB0aGF0IGJlZ2lucyB0aGlzIGlubGluZSBjb21tZW50LlxyXG4gICAgICAgICAgICAvLyBUbyBmaW5pc2ggdGhlIGlubGluZSBjb21tZW50LCB3ZSBsb29rIGZvciBhIG5ld2xpbmUgb3IgdGhlIGVuZCBvZiB0aGUgdGV4dC5cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoICE9PSAnLycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoXCJOb3QgYW4gaW5saW5lIGNvbW1lbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICdcXG4nIHx8IHRoaXMuY2ggPT09ICdcXHInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IHdoaWxlICh0aGlzLmNoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBibG9ja0NvbW1lbnQoKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBTa2lwIGEgYmxvY2sgY29tbWVudCwgYXNzdW1pbmcgdGhpcyBpcyBvbmUuIFRoZSBjdXJyZW50IGNoYXJhY3RlciBzaG91bGQgYmVcclxuICAgICAgICAgICAgLy8gdGhlICogY2hhcmFjdGVyIGluIHRoZSAvKiBwYWlyIHRoYXQgYmVnaW5zIHRoaXMgYmxvY2sgY29tbWVudC5cclxuICAgICAgICAgICAgLy8gVG8gZmluaXNoIHRoZSBibG9jayBjb21tZW50LCB3ZSBsb29rIGZvciBhbiBlbmRpbmcgKi8gcGFpciBvZiBjaGFyYWN0ZXJzLFxyXG4gICAgICAgICAgICAvLyBidXQgd2UgYWxzbyB3YXRjaCBmb3IgdGhlIGVuZCBvZiB0ZXh0IGJlZm9yZSB0aGUgY29tbWVudCBpcyB0ZXJtaW5hdGVkLlxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2ggIT09ICcqJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcihcIk5vdCBhIGJsb2NrIGNvbW1lbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuY2ggPT09ICcqJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnKicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAnLycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCcvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuY2gpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5lcnJvcihcIlVudGVybWluYXRlZCBibG9jayBjb21tZW50XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGNvbW1lbnQoKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBTa2lwIGEgY29tbWVudCwgd2hldGhlciBpbmxpbmUgb3IgYmxvY2stbGV2ZWwsIGFzc3VtaW5nIHRoaXMgaXMgb25lLlxyXG4gICAgICAgICAgICAvLyBDb21tZW50cyBhbHdheXMgYmVnaW4gd2l0aCBhIC8gY2hhcmFjdGVyLlxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2ggIT09ICcvJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcihcIk5vdCBhIGNvbW1lbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgnLycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICcvJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbmxpbmVDb21tZW50KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaCA9PT0gJyonKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrQ29tbWVudCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcihcIlVucmVjb2duaXplZCBjb21tZW50XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgd2hpdGUoKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzLlxyXG4gICAgICAgICAgICAvLyBOb3RlIHRoYXQgd2UncmUgZGV0ZWN0aW5nIGNvbW1lbnRzIGJ5IG9ubHkgYSBzaW5nbGUgLyBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgd29ya3Mgc2luY2UgcmVndWxhciBleHByZXNzaW9ucyBhcmUgbm90IHZhbGlkIEpTT04oNSksIGJ1dCB0aGlzIHdpbGxcclxuICAgICAgICAgICAgLy8gYnJlYWsgaWYgdGhlcmUgYXJlIG90aGVyIHZhbGlkIHZhbHVlcyB0aGF0IGJlZ2luIHdpdGggYSAvIGNoYXJhY3RlciFcclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmNoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaCA9PT0gJy8nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21tZW50KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFN1cnZleUpTT041LndzLmluZGV4T2YodGhpcy5jaCkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSB3b3JkKCk6IGFueSB7XHJcblxyXG4gICAgICAgICAgICAvLyB0cnVlLCBmYWxzZSwgb3IgbnVsbC5cclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5jaCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCd0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCdyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCd1Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCdlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmJzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ2YnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ2EnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ2wnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ3MnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ2UnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBjYXNlICduJzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ24nKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ3UnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ2wnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ2wnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ0knOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnSScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnZicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnaScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnaScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgndCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgneScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJbmZpbml0eTtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ04nOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnTicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnYScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnTicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOYU47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lcnJvcihcIlVuZXhwZWN0ZWQgJ1wiICsgdGhpcy5jaCArIFwiJ1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBhcnJheSgpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFBhcnNlIGFuIGFycmF5IHZhbHVlLlxyXG5cclxuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jaCA9PT0gJ1snKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ1snKTtcclxuICAgICAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICddJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ10nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5OyAgIC8vIFBvdGVudGlhbGx5IGVtcHR5IGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVTNSBhbGxvd3Mgb21pdHRpbmcgZWxlbWVudHMgaW4gYXJyYXlzLCBlLmcuIFssXSBhbmRcclxuICAgICAgICAgICAgICAgICAgICAvLyBbLG51bGxdLiBXZSBkb24ndCBhbGxvdyB0aGlzIGluIEpTT041LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAnLCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvcihcIk1pc3NpbmcgYXJyYXkgZWxlbWVudFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJheS5wdXNoKHRoaXMudmFsdWUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGNvbW1hIGFmdGVyIHRoaXMgdmFsdWUsIHRoaXMgbmVlZHMgdG9cclxuICAgICAgICAgICAgICAgICAgICAvLyBiZSB0aGUgZW5kIG9mIHRoZSBhcnJheS5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaCAhPT0gJywnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnXScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnLCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVycm9yKFwiQmFkIGFycmF5XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIG9iamVjdCgpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFBhcnNlIGFuIG9iamVjdCB2YWx1ZS5cclxuXHJcbiAgICAgICAgICAgIHZhciBrZXksXHJcbiAgICAgICAgICAgICAgICBzdGFydCxcclxuICAgICAgICAgICAgICAgIGlzRmlyc3RQcm9wZXJ0eSA9IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvYmplY3QgPSB7fTtcclxuICAgICAgICAgICAgaWYgKHRoaXMucGFyc2VUeXBlID4gMCkge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0W1N1cnZleUpTT041LnBvc2l0aW9uTmFtZV0gPSB7IHN0YXJ0OiB0aGlzLmF0IC0gMSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoID09PSAneycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCgneycpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aGl0ZSgpO1xyXG4gICAgICAgICAgICAgICAgc3RhcnQgPSB0aGlzLmF0IC0gMTtcclxuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICd9Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJzZVR5cGUgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbU3VydmV5SlNPTjUucG9zaXRpb25OYW1lXS5lbmQgPSBzdGFydDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ30nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDsgICAvLyBQb3RlbnRpYWxseSBlbXB0eSBvYmplY3RcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEtleXMgY2FuIGJlIHVucXVvdGVkLiBJZiB0aGV5IGFyZSwgdGhleSBuZWVkIHRvIGJlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFsaWQgSlMgaWRlbnRpZmllcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2ggPT09ICdcIicgfHwgdGhpcy5jaCA9PT0gXCInXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gdGhpcy5zdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSB0aGlzLmlkZW50aWZpZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJzZVR5cGUgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFtTdXJ2ZXlKU09ONS5wb3NpdGlvbk5hbWVdW2tleV0gPSB7IHN0YXJ0OiBzdGFydCwgdmFsdWVTdGFydDogdGhpcy5hdCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJzonKTtcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHRoaXMudmFsdWUoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJzZVR5cGUgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0ID0gdGhpcy5hdCAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFtTdXJ2ZXlKU09ONS5wb3NpdGlvbk5hbWVdW2tleV0udmFsdWVFbmQgPSBzdGFydDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W1N1cnZleUpTT041LnBvc2l0aW9uTmFtZV1ba2V5XS5lbmQgPSBzdGFydDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aGl0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gY29tbWEgYWZ0ZXIgdGhpcyBwYWlyLCB0aGlzIG5lZWRzIHRvIGJlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgb2JqZWN0LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoICE9PSAnLCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyc2VUeXBlID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W1N1cnZleUpTT041LnBvc2l0aW9uTmFtZV1ba2V5XS52YWx1ZUVuZC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W1N1cnZleUpTT041LnBvc2l0aW9uTmFtZV1ba2V5XS5lbmQtLTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJzZVR5cGUgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbU3VydmV5SlNPTjUucG9zaXRpb25OYW1lXS5lbmQgPSB0aGlzLmF0IC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoJ30nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyc2VUeXBlID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbU3VydmV5SlNPTjUucG9zaXRpb25OYW1lXVtrZXldLnZhbHVlRW5kLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGaXJzdFByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbU3VydmV5SlNPTjUucG9zaXRpb25OYW1lXVtrZXldLmVuZC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgnLCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBpc0ZpcnN0UHJvcGVydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVycm9yKFwiQmFkIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSB2YWx1ZSgpOiBhbnkge1xyXG5cclxuICAgICAgICAgICAgLy8gUGFyc2UgYSBKU09OIHZhbHVlLiBJdCBjb3VsZCBiZSBhbiBvYmplY3QsIGFuIGFycmF5LCBhIHN0cmluZywgYSBudW1iZXIsXHJcbiAgICAgICAgICAgIC8vIG9yIGEgd29yZC5cclxuXHJcbiAgICAgICAgICAgIHRoaXMud2hpdGUoKTtcclxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLmNoKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd7JzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vYmplY3QoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ1snOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFycmF5KCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdcIic6XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiJ1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnLSc6XHJcbiAgICAgICAgICAgICAgICBjYXNlICcrJzpcclxuICAgICAgICAgICAgICAgIGNhc2UgJy4nOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm51bWJlcigpO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaCA+PSAnMCcgJiYgdGhpcy5jaCA8PSAnOScgPyB0aGlzLm51bWJlcigpIDogdGhpcy53b3JkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgcmVwbGFjZXI6IGFueTtcclxuICAgICAgICBwcml2YXRlIGluZGVudFN0cjogc3RyaW5nO1xyXG4gICAgICAgIHByaXZhdGUgb2JqU3RhY2s7XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdHJpbmdpZnkob2JqOiBhbnksIHJlcGxhY2VyOiBhbnkgPSBudWxsLCBzcGFjZTogYW55ID0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIgJiYgKHR5cGVvZiAocmVwbGFjZXIpICE9PSBcImZ1bmN0aW9uXCIgJiYgIXRoaXMuaXNBcnJheShyZXBsYWNlcikpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlcGxhY2VyIG11c3QgYmUgYSBmdW5jdGlvbiBvciBhbiBhcnJheScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZXIgPSByZXBsYWNlcjtcclxuICAgICAgICAgICAgdGhpcy5pbmRlbnRTdHIgPSB0aGlzLmdldEluZGVudChzcGFjZSk7XHJcbiAgICAgICAgICAgIHRoaXMub2JqU3RhY2sgPSBbXTtcclxuICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlLi4ud2hlbiB1bmRlZmluZWQgaXMgdXNlZCBpbnNpZGUgb2ZcclxuICAgICAgICAgICAgLy8gYSBjb21wb3VuZCBvYmplY3QvYXJyYXksIHJldHVybiBudWxsLlxyXG4gICAgICAgICAgICAvLyBidXQgd2hlbiB0b3AtbGV2ZWwsIHJldHVybiB1bmRlZmluZWRcclxuICAgICAgICAgICAgdmFyIHRvcExldmVsSG9sZGVyID0geyBcIlwiOiBvYmogfTtcclxuICAgICAgICAgICAgaWYgKG9iaiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRSZXBsYWNlZFZhbHVlT3JVbmRlZmluZWQodG9wTGV2ZWxIb2xkZXIsICcnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnRlcm5hbFN0cmluZ2lmeSh0b3BMZXZlbEhvbGRlciwgJycsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldEluZGVudChzcGFjZTogYW55KTogc3RyaW5nIHtcclxuICAgICAgICAgICAgaWYgKHNwYWNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNwYWNlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwYWNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3BhY2UgPT09IFwibnVtYmVyXCIgJiYgc3BhY2UgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1ha2VJbmRlbnQoXCIgXCIsIHNwYWNlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBnZXRSZXBsYWNlZFZhbHVlT3JVbmRlZmluZWQoaG9sZGVyOiBhbnksIGtleTogYW55LCBpc1RvcExldmVsOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGhvbGRlcltrZXldO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgdmFsdWUgd2l0aCBpdHMgdG9KU09OIHZhbHVlIGZpcnN0LCBpZiBwb3NzaWJsZVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUudG9KU09OICYmIHR5cGVvZiB2YWx1ZS50b0pTT04gPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSWYgdGhlIHVzZXItc3VwcGxpZWQgcmVwbGFjZXIgaWYgYSBmdW5jdGlvbiwgY2FsbCBpdC4gSWYgaXQncyBhbiBhcnJheSwgY2hlY2sgb2JqZWN0cycgc3RyaW5nIGtleXMgZm9yXHJcbiAgICAgICAgICAgIC8vIHByZXNlbmNlIGluIHRoZSBhcnJheSAocmVtb3ZpbmcgdGhlIGtleS92YWx1ZSBwYWlyIGZyb20gdGhlIHJlc3VsdGluZyBKU09OIGlmIHRoZSBrZXkgaXMgbWlzc2luZykuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHRoaXMucmVwbGFjZXIpID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2VyLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlcGxhY2VyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNUb3BMZXZlbCB8fCB0aGlzLmlzQXJyYXkoaG9sZGVyKSB8fCB0aGlzLnJlcGxhY2VyLmluZGV4T2Yoa2V5KSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGlzV29yZENoYXIoY2hhcjogYW55KTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHJldHVybiAoY2hhciA+PSAnYScgJiYgY2hhciA8PSAneicpIHx8XHJcbiAgICAgICAgICAgICAgICAoY2hhciA+PSAnQScgJiYgY2hhciA8PSAnWicpIHx8XHJcbiAgICAgICAgICAgICAgICAoY2hhciA+PSAnMCcgJiYgY2hhciA8PSAnOScpIHx8XHJcbiAgICAgICAgICAgICAgICBjaGFyID09PSAnXycgfHwgY2hhciA9PT0gJyQnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBpc1dvcmRTdGFydChjaGFyOiBhbnkpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIChjaGFyID49ICdhJyAmJiBjaGFyIDw9ICd6JykgfHxcclxuICAgICAgICAgICAgICAgIChjaGFyID49ICdBJyAmJiBjaGFyIDw9ICdaJykgfHxcclxuICAgICAgICAgICAgICAgIGNoYXIgPT09ICdfJyB8fCBjaGFyID09PSAnJCc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGlzV29yZChrZXk6IGFueSk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNXb3JkU3RhcnQoa2V5WzBdKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBpID0gMSwgbGVuZ3RoID0ga2V5Lmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1dvcmRDaGFyKGtleVtpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBvbHlmaWxsc1xyXG4gICAgICAgIHByaXZhdGUgaXNBcnJheShvYmo6IGFueSk6IGJvb2xlYW4ge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBpc0RhdGUob2JqOiBhbnkpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIGlzTmFOKHZhbDogYW55KTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyAmJiB2YWwgIT09IHZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJpdmF0ZSBjaGVja0ZvckNpcmN1bGFyKG9iajogYW55KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vYmpTdGFjay5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqU3RhY2tbaV0gPT09IG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDb252ZXJ0aW5nIGNpcmN1bGFyIHN0cnVjdHVyZSB0byBKU09OXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgbWFrZUluZGVudChzdHI6IHN0cmluZywgbnVtOiBudW1iZXIsIG5vTmV3TGluZTogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGlmICghc3RyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBpbmRlbnRhdGlvbiBubyBtb3JlIHRoYW4gMTAgY2hhcnNcclxuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGggPiAxMCkge1xyXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCAxMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpbmRlbnQgPSBub05ld0xpbmUgPyBcIlwiIDogXCJcXG5cIjtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW07IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaW5kZW50ICs9IHN0cjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGluZGVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvcGllZCBmcm9tIENyb2tmb3JkJ3MgaW1wbGVtZW50YXRpb24gb2YgSlNPTlxyXG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZG91Z2xhc2Nyb2NrZm9yZC9KU09OLWpzL2Jsb2IvZTM5ZGI0YjdlNjI0OWYwNGExOTVlN2RkMDg0MGU2MTBjYzllOTQxZS9qc29uMi5qcyNMMTk1XHJcbiAgICAgICAgLy8gQmVnaW5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBjeCA9IC9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nO1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGVzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2c7XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgbWV0YSA9IHsgLy8gdGFibGUgb2YgY2hhcmFjdGVyIHN1YnN0aXR1dGlvbnNcclxuICAgICAgICAgICAgJ1xcYic6ICdcXFxcYicsXHJcbiAgICAgICAgICAgICdcXHQnOiAnXFxcXHQnLFxyXG4gICAgICAgICAgICAnXFxuJzogJ1xcXFxuJyxcclxuICAgICAgICAgICAgJ1xcZic6ICdcXFxcZicsXHJcbiAgICAgICAgICAgICdcXHInOiAnXFxcXHInLFxyXG4gICAgICAgICAgICAnXCInOiAnXFxcXFwiJyxcclxuICAgICAgICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXHJcbiAgICAgICAgfTtcclxuICAgICAgICBwcml2YXRlIGVzY2FwZVN0cmluZyhzdHI6IHN0cmluZykge1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgdGhlIHN0cmluZyBjb250YWlucyBubyBjb250cm9sIGNoYXJhY3RlcnMsIG5vIHF1b3RlIGNoYXJhY3RlcnMsIGFuZCBub1xyXG4gICAgICAgICAgICAvLyBiYWNrc2xhc2ggY2hhcmFjdGVycywgdGhlbiB3ZSBjYW4gc2FmZWx5IHNsYXAgc29tZSBxdW90ZXMgYXJvdW5kIGl0LlxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2Ugd2UgbXVzdCBhbHNvIHJlcGxhY2UgdGhlIG9mZmVuZGluZyBjaGFyYWN0ZXJzIHdpdGggc2FmZSBlc2NhcGVcclxuICAgICAgICAgICAgLy8gc2VxdWVuY2VzLlxyXG4gICAgICAgICAgICBTdXJ2ZXlKU09ONS5lc2NhcGFibGUubGFzdEluZGV4ID0gMDtcclxuICAgICAgICAgICAgcmV0dXJuIFN1cnZleUpTT041LmVzY2FwYWJsZS50ZXN0KHN0cikgPyAnXCInICsgc3RyLnJlcGxhY2UoU3VydmV5SlNPTjUuZXNjYXBhYmxlLCBmdW5jdGlvbiAoYSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGMgPSBTdXJ2ZXlKU09ONS5tZXRhW2FdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBjID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgICAgICAgICAgICAgYyA6XHJcbiAgICAgICAgICAgICAgICAgICAgJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XHJcbiAgICAgICAgICAgIH0pICsgJ1wiJyA6ICdcIicgKyBzdHIgKyAnXCInO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBFbmRcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBpbnRlcm5hbFN0cmluZ2lmeShob2xkZXI6IGFueSwga2V5OiBhbnksIGlzVG9wTGV2ZWw6IGJvb2xlYW4pIHtcclxuICAgICAgICAgICAgdmFyIGJ1ZmZlciwgcmVzO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgdmFsdWUsIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgICAgICB2YXIgb2JqX3BhcnQgPSB0aGlzLmdldFJlcGxhY2VkVmFsdWVPclVuZGVmaW5lZChob2xkZXIsIGtleSwgaXNUb3BMZXZlbCk7XHJcblxyXG4gICAgICAgICAgICBpZiAob2JqX3BhcnQgJiYgIXRoaXMuaXNEYXRlKG9ial9wYXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdW5ib3ggb2JqZWN0c1xyXG4gICAgICAgICAgICAgICAgLy8gZG9uJ3QgdW5ib3ggZGF0ZXMsIHNpbmNlIHdpbGwgdHVybiBpdCBpbnRvIG51bWJlclxyXG4gICAgICAgICAgICAgICAgb2JqX3BhcnQgPSBvYmpfcGFydC52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3dpdGNoICh0eXBlb2Ygb2JqX3BhcnQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJib29sZWFuXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ial9wYXJ0LnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05hTihvYmpfcGFydCkgfHwgIWlzRmluaXRlKG9ial9wYXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpfcGFydC50b1N0cmluZygpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lc2NhcGVTdHJpbmcob2JqX3BhcnQudG9TdHJpbmcoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmpfcGFydCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzQXJyYXkob2JqX3BhcnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tGb3JDaXJjdWxhcihvYmpfcGFydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IFwiW1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9ialN0YWNrLnB1c2gob2JqX3BhcnQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpfcGFydC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gdGhpcy5pbnRlcm5hbFN0cmluZ2lmeShvYmpfcGFydCwgaSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyICs9IHRoaXMubWFrZUluZGVudCh0aGlzLmluZGVudFN0ciwgdGhpcy5vYmpTdGFjay5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcyA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyICs9IFwibnVsbFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgKz0gcmVzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCBvYmpfcGFydC5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyICs9IFwiLFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmluZGVudFN0cikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBcIlxcblwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub2JqU3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciArPSB0aGlzLm1ha2VJbmRlbnQodGhpcy5pbmRlbnRTdHIsIHRoaXMub2JqU3RhY2subGVuZ3RoLCB0cnVlKSArIFwiXVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tGb3JDaXJjdWxhcihvYmpfcGFydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IFwie1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9uRW1wdHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmpTdGFjay5wdXNoKG9ial9wYXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmpfcGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ial9wYXJ0Lmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5pbnRlcm5hbFN0cmluZ2lmeShvYmpfcGFydCwgcHJvcCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVG9wTGV2ZWwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiICYmIHZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciArPSB0aGlzLm1ha2VJbmRlbnQodGhpcy5pbmRlbnRTdHIsIHRoaXMub2JqU3RhY2subGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9uRW1wdHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcEtleSA9IHRoaXMuaXNXb3JkKHByb3ApID8gcHJvcCA6IHRoaXMuZXNjYXBlU3RyaW5nKHByb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgKz0gcHJvcEtleSArIFwiOlwiICsgKHRoaXMuaW5kZW50U3RyID8gJyAnIDogJycpICsgdmFsdWUgKyBcIixcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmpTdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vbkVtcHR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXIuc3Vic3RyaW5nKDAsIGJ1ZmZlci5sZW5ndGggLSAxKSArIHRoaXMubWFrZUluZGVudCh0aGlzLmluZGVudFN0ciwgdGhpcy5vYmpTdGFjay5sZW5ndGgpICsgXCJ9XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSAne30nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZ1bmN0aW9ucyBhbmQgdW5kZWZpbmVkIHNob3VsZCBiZSBpZ25vcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8qIVxuKiBzdXJ2ZXlqcyBFZGl0b3IgdjAuOS4xMFxuKiAoYykgQW5kcmV3IFRlbG5vdiAtIGh0dHA6Ly9zdXJ2ZXlqcy5vcmcvYnVpbGRlci9cbiogR2l0aHViIC0gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld3RlbG5vdi9zdXJ2ZXkuanMuZWRpdG9yXG4qL1xuXG5tb2R1bGUgU3VydmV5RWRpdG9yIHtcclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU3VydmV5T2JqZWN0SXRlbSB7XHJcbiAgICAgICAgcHVibGljIHZhbHVlOiBTdXJ2ZXkuQmFzZTtcclxuICAgICAgICBwdWJsaWMgdGV4dDogYW55O1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBTdXJ2ZXlPYmplY3RzIHtcclxuICAgICAgICBwdWJsaWMgc3RhdGljIGludGVuZDogc3RyaW5nID0gXCIuLi5cIjtcclxuICAgICAgICBzdXJ2ZXlWYWx1ZTogU3VydmV5LlN1cnZleTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHVibGljIGtvT2JqZWN0czogYW55LCBwdWJsaWMga29TZWxlY3RlZDogYW55KSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBnZXQgc3VydmV5KCk6IFN1cnZleS5TdXJ2ZXkgeyByZXR1cm4gdGhpcy5zdXJ2ZXlWYWx1ZTsgfVxyXG4gICAgICAgIHB1YmxpYyBzZXQgc3VydmV5KHZhbHVlOiBTdXJ2ZXkuU3VydmV5KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN1cnZleSA9PSB2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLnN1cnZleVZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMucmVidWlsZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgYWRkUGFnZShwYWdlOiBTdXJ2ZXkuUGFnZSkge1xyXG4gICAgICAgICAgICB2YXIgcGFnZUl0ZW0gPSB0aGlzLmNyZWF0ZVBhZ2UocGFnZSk7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuc3VydmV5LnBhZ2VzLmluZGV4T2YocGFnZSk7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcmV2UGFnZSA9IHRoaXMuc3VydmV5LnBhZ2VzW2luZGV4IC0gMV07XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KHByZXZQYWdlKSArIDE7XHJcbiAgICAgICAgICAgICAgICBpbmRleCArPSBwcmV2UGFnZS5xdWVzdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSAxOyAvLzAgLSBTdXJ2ZXlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFkZEl0ZW0ocGFnZUl0ZW0sIGluZGV4KTtcclxuICAgICAgICAgICAgaW5kZXgrKztcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlLnF1ZXN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLmNyZWF0ZVF1ZXN0aW9uKHBhZ2UucXVlc3Rpb25zW2ldKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkSXRlbShpdGVtLCBpbmRleCArIGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMua29TZWxlY3RlZChwYWdlSXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBhZGRRdWVzdGlvbihwYWdlOiBTdXJ2ZXkuUGFnZSwgcXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UpIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgocGFnZSk7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIHF1ZXN0aW9uSW5kZXggPSBwYWdlLnF1ZXN0aW9ucy5pbmRleE9mKHF1ZXN0aW9uKSArIDE7XHJcbiAgICAgICAgICAgIGluZGV4ICs9IHF1ZXN0aW9uSW5kZXg7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gdGhpcy5jcmVhdGVRdWVzdGlvbihxdWVzdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkSXRlbShpdGVtLCBpbmRleCk7XHJcbiAgICAgICAgICAgIHRoaXMua29TZWxlY3RlZChpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHNlbGVjdE9iamVjdChvYmo6IFN1cnZleS5CYXNlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmpzID0gdGhpcy5rb09iamVjdHMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2Jqc1tpXS52YWx1ZSA9PSBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQob2Jqc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyByZW1vdmVPYmplY3Qob2JqOiBTdXJ2ZXkuQmFzZSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldEl0ZW1JbmRleChvYmopO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPCAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBjb3VudFRvUmVtb3ZlID0gMTtcclxuICAgICAgICAgICAgaWYgKFN1cnZleUhlbHBlci5nZXRPYmplY3RUeXBlKG9iaikgPT0gT2JqVHlwZS5QYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZTogU3VydmV5LlBhZ2UgPSA8U3VydmV5LlBhZ2U+b2JqO1xyXG4gICAgICAgICAgICAgICAgY291bnRUb1JlbW92ZSArPSBwYWdlLnF1ZXN0aW9ucy5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb09iamVjdHMuc3BsaWNlKGluZGV4LCBjb3VudFRvUmVtb3ZlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIG5hbWVDaGFuZ2VkKG9iajogU3VydmV5LkJhc2UpIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgob2JqKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4IDwgMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmtvT2JqZWN0cygpW2luZGV4XS50ZXh0KHRoaXMuZ2V0VGV4dChvYmopKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHNlbGVjdE5leHRRdWVzdGlvbihpc1VwOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIHZhciBxdWVzdGlvbiA9IHRoaXMuZ2V0U2VsZWN0ZWRRdWVzdGlvbigpO1xyXG4gICAgICAgICAgICB2YXIgaXRlbUluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgocXVlc3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaXRlbUluZGV4IDwgMCkgcmV0dXJuIHF1ZXN0aW9uO1xyXG4gICAgICAgICAgICB2YXIgb2JqcyA9IHRoaXMua29PYmplY3RzKCk7XHJcbiAgICAgICAgICAgIHZhciBuZXdJdGVtSW5kZXggPSBpdGVtSW5kZXggKyAoaXNVcCA/IC0xIDogMSk7XHJcbiAgICAgICAgICAgIGlmIChuZXdJdGVtSW5kZXggPCBvYmpzLmxlbmd0aCAmJiBTdXJ2ZXlIZWxwZXIuZ2V0T2JqZWN0VHlwZShvYmpzW25ld0l0ZW1JbmRleF0udmFsdWUpID09IE9ialR5cGUuUXVlc3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IG5ld0l0ZW1JbmRleDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5ld0l0ZW1JbmRleCA9IGl0ZW1JbmRleDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChuZXdJdGVtSW5kZXggPCBvYmpzLmxlbmd0aCAmJiBTdXJ2ZXlIZWxwZXIuZ2V0T2JqZWN0VHlwZShvYmpzW25ld0l0ZW1JbmRleF0udmFsdWUpID09IE9ialR5cGUuUXVlc3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBuZXdJdGVtSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbUluZGV4ICs9IChpc1VwID8gMSA6IC0xKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQob2Jqc1tpdGVtSW5kZXhdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBnZXRTZWxlY3RlZFF1ZXN0aW9uKCk6IFN1cnZleS5RdWVzdGlvbkJhc2Uge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMua29TZWxlY3RlZCgpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHRoaXMua29TZWxlY3RlZCgpLnZhbHVlO1xyXG4gICAgICAgICAgICBpZiAoIW9iaikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBTdXJ2ZXlIZWxwZXIuZ2V0T2JqZWN0VHlwZShvYmopID09IE9ialR5cGUuUXVlc3Rpb24gPyA8U3VydmV5LlF1ZXN0aW9uQmFzZT4ob2JqKSA6IG51bGw7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGFkZEl0ZW0oaXRlbTogU3VydmV5T2JqZWN0SXRlbSwgaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiB0aGlzLmtvT2JqZWN0cygpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rb09iamVjdHMucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMua29PYmplY3RzLnNwbGljZShpbmRleCwgMCwgaXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSByZWJ1aWxkKCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqcyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zdXJ2ZXkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rb09iamVjdHMob2Jqcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmtvU2VsZWN0ZWQobnVsbCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb2Jqcy5wdXNoKHRoaXMuY3JlYXRlSXRlbSh0aGlzLnN1cnZleSwgXCJTdXJ2ZXlcIikpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3VydmV5LnBhZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IDxTdXJ2ZXkuUGFnZT50aGlzLnN1cnZleS5wYWdlc1tpXTtcclxuICAgICAgICAgICAgICAgIG9ianMucHVzaCh0aGlzLmNyZWF0ZVBhZ2UocGFnZSkpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYWdlLnF1ZXN0aW9ucy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ianMucHVzaCh0aGlzLmNyZWF0ZVF1ZXN0aW9uKHBhZ2UucXVlc3Rpb25zW2pdKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5rb09iamVjdHMob2Jqcyk7XHJcbiAgICAgICAgICAgIHRoaXMua29TZWxlY3RlZCh0aGlzLnN1cnZleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgY3JlYXRlUGFnZShwYWdlOiBTdXJ2ZXkuUGFnZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVJdGVtKHBhZ2UsIHRoaXMuZ2V0VGV4dChwYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgY3JlYXRlUXVlc3Rpb24ocXVlc3Rpb246IFN1cnZleS5RdWVzdGlvbkJhc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlSXRlbShxdWVzdGlvbiwgdGhpcy5nZXRUZXh0KHF1ZXN0aW9uKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgY3JlYXRlSXRlbSh2YWx1ZTogU3VydmV5LkJhc2UsIHRleHQ6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IG5ldyBTdXJ2ZXlPYmplY3RJdGVtKCk7XHJcbiAgICAgICAgICAgIGl0ZW0udmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgaXRlbS50ZXh0ID0ga28ub2JzZXJ2YWJsZSh0ZXh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgZ2V0SXRlbUluZGV4KHZhbHVlOiBTdXJ2ZXkuQmFzZSk6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHZhciBvYmpzID0gdGhpcy5rb09iamVjdHMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2Jqc1tpXS52YWx1ZSA9PSB2YWx1ZSkgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldFRleHQob2JqOiBTdXJ2ZXkuQmFzZSk6IHN0cmluZyB7XHJcbiAgICAgICAgICAgIHZhciBpbnRlbmQgPSBTdXJ2ZXlPYmplY3RzLmludGVuZDtcclxuICAgICAgICAgICAgaWYgKFN1cnZleUhlbHBlci5nZXRPYmplY3RUeXBlKG9iaikgIT0gT2JqVHlwZS5QYWdlKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlbmQgKz0gU3VydmV5T2JqZWN0cy5pbnRlbmQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGludGVuZCArIFN1cnZleUhlbHBlci5nZXRPYmplY3ROYW1lKG9iaik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiJzcmMifQ==