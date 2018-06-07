import { observable, computed, action } from "mobx";
import { AsyncStorage } from "react-native";

export default class Store {
  constructor() {
    this.initFromStore();
  }

  // Sorted array of dates
  @observable dates = [];
  // Dictionary of tasks. content[date] returns an array of tasks
  @observable content = {};

  // Get dates and content from asyncStorage
  @action
  initFromStore() {
    AsyncStorage.getItem("dates").then(dates => {
      if (dates !== null) {
        this.dates = JSON.parse(dates);
      }
    });

    AsyncStorage.getItem("content").then(content => {
      function stringDate(date) {
        let today =
          date.getUTCFullYear() +
          "-" +
          ("0" + (date.getMonth() + 1)).slice(-2) +
          "-" +
          ("0" + date.getDate()).slice(-2);

        return today;
      }
      if (content !== null) {
        this.content = JSON.parse(content);
      } else {
        // init tutorial
        var today = new Date();
        var yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        var dayAfterTomottow = new Date(today);
        dayAfterTomottow.setDate(today.getDate() + 2);
        var twentyDaysFromNow = new Date(today);
        twentyDaysFromNow.setDate(today.getDate() + 20);

        this.addTask("Drag the grey area above me to move the agenda up and down", stringDate(yesterday));
        this.addTask("Press and hold a date on the calendar to add a task on that date", stringDate(yesterday));
        this.addTask("Press a date on the calendar to scroll the agenda to that date", stringDate(yesterday));
        this.addTask("This is an overdue task. It was due yesterday.", stringDate(yesterday));
        this.addTask("Overdue tasks are colored red", stringDate(yesterday));

        this.addTask("This task is due today", stringDate(today));
        this.addTask("Tasks due today are colored green", stringDate(today));
        this.addTask("Swipe tasks to the left when they are complete", stringDate(today));
        this.content[stringDate(today)].push({
          task: "Click here to add additional notes to this task",
          id: Math.floor(Math.random() * 1000000000).toString(),
          notes: "This is a note. Click here to edit it"
        });
        this.saveToStore();

        this.addTask("This is a task due in the near future", stringDate(dayAfterTomottow));
        this.addTask("Tasks due in the near future are colored blue", stringDate(dayAfterTomottow));

        this.addTask("I am a task due in the distant future", stringDate(twentyDaysFromNow));
        this.addTask("Tasks due in the distant future are colored light blue", stringDate(twentyDaysFromNow));

      }
    });
  }

  // Save dates and content to asyncStorage
  @action
  saveToStore() {
    AsyncStorage.setItem("dates", JSON.stringify(this.dates));
    AsyncStorage.setItem("content", JSON.stringify(this.content));
  }

  // Adds a task
  @action
  addTaskToNewDate(task, date) {
    function isDateBigger(date1, date2) {
      date1 = date1.split("-");
      date2 = date2.split("-");

      let date1Year = parseInt(date1[0]);
      let date1Month = parseInt(date1[1]) - 1;
      let date1Day = parseInt(date1[2]);

      let date2Year = parseInt(date2[0]);
      let date2Month = parseInt(date2[1]) - 1;
      let date2Day = parseInt(date2[2]);

      date1 = new Date(date1Year, date1Month, date1Day);
      date2 = new Date(date2Year, date2Month, date2Day);

      return date2 > date1;
    }
    insertIndex = this.dates.length;
    for (let i = 0; i < this.dates.length; i++) {
      if (isDateBigger(date, this.dates[i])) {
        insertIndex = i;
        break;
      }
    }
    this.dates.splice(insertIndex, 0, date);
    this.content[date] = observable([
      observable({
        task: task,
        id: Math.floor(Math.random() * 1000000000).toString(),
        notes: ""
      })
    ]);
  }

  // Adds a task to an existing date
  @action
  addTaskToExistingDate(task, date) {
    this.content[date].push({
      task: task,
      id: Math.floor(Math.random() * 1000000000).toString(),
      notes: ""
    });
  }

  // Determines whether to use addTaskToNewDate or addTaskToExistingDate then calls saveToStore
  @action
  addTask(task, date) {
    if (this.content[date] === undefined) {
      this.addTaskToNewDate(task, date);
    } else {
      this.addTaskToExistingDate(task, date);
    }
    this.saveToStore();
  }

  // Removes a task
  @action
  removeTask(task, date) {
    if (this.content[date].length === 1) {
      this.dates.splice(this.dates.indexOf(date), 1);
      this.content[date] = undefined;
    } else {
      this.content[date].splice(
        this.content[date]
          .map(function(e) {
            return e.id;
          })
          .indexOf(task.id),
        1
      );
    }
    this.saveToStore();
  }

  // Defines which dates on the calendar are marked in accordance to react-native-calendars
  // https://github.com/wix/react-native-calendars
  @computed
  get markedDates() {
    let markedDates = this.dates.reduce((obj, item) => {
      obj[item] = { marked: true };
      return obj;
    }, {});
    let date = new Date();
    let today =
      date.getUTCFullYear() +
      "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getDate()).slice(-2);

    markedDates[today] = { selected: true };

    return markedDates;
  }
}
