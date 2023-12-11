import { defineStore } from "pinia";
import { parseISO, formatISO, addDays, isBefore, isAfter } from "date-fns";
import { api } from "boot/axios";

export const useEventStore = defineStore("events", {
  state: () => ({
    selectedEvent: null,
    events: [],
    resourceTypes: [],
    templates: [],
  }),
  getters: {
    getEventsForDate: (state) => (timestamp) => {
      const start = new Date(timestamp.date);
      const end = addDays(start, 1);
      return state.events.filter(
        (e) =>
          isAfter(new Date(e.startTime), start) &&
          isBefore(new Date(e.startTime), end)
      );
    },
  },
  actions: {
    async getEventsForDates(start, end) {
      var startDate = encodeURIComponent(
        formatISO(parseISO(start), { representation: "date" })
      );
      var endDate = encodeURI(
        formatISO(addDays(parseISO(end), 1), { representation: "date" })
      );
      const response = await api.get(
        `/api/events?start=${startDate}&end=${endDate}`
      );
      this.events = response.data;
    },
    async addEvent(event) {
      const response = await api.post("/api/events", event);
    },
    async getEvent(id) {
      const response = await api.get(`/api/events/${id}`);
      this.selectedEvent = response.data;
    },
    async deleteEvent(id) {
      await api.delete(`/api/events/${id}`);
      this.selectedEvent = null;
      this.events = this.events.filter((e) => e.id !== id);
    },
    async updateEvent(id, event) {
      const response = await api.put(`/api/events/${id}`, event);
      this.selectedEvent = response.data;
    },

    async createResourceType(resourceType) {
      const response = await api.post("/api/resourcetypes", resourceType);
      await this.getResourceTypes();
    },

    async updateResourceType(resourceType) {
      const response = await api.put(
        `/api/resourcetypes/${resourceType.id}`,
        resourceType
      );
      await this.getResourceTypes();
    },

    async deleteResourceType(resourceType) {
      const response = await api.delete(
        `/api/resourcetypes/${resourceType.id}`
      );
      await this.getResourceTypes();
    },
    async getResourceTypes() {
      // if (this.resourceTypes.length) return;
      const response = await api.get("/api/resourcetypes");
      this.resourceTypes = response.data;
    },

    async addShift(parentResource, user) {
      const model = {
        startTime: parentResource.startTime,
        endTime: parentResource.endTime,
        userId: user.id,
      };
      const response = await api.post(
        `/api/resources/${parentResource.id}/shifts`,
        model
      );

      const newShift = response.data;

      this.events.forEach((e) => {
        const resource = e.resources.find(
          (r) => r.id === newShift.eventResourceId
        );
        if (resource) {
          resource.shifts.push(newShift);
          return;
        }
      });
    },
    async deleteShift(shift) {
      const response = await api.delete(`/api/shifts/${shift.id}`);
      const deletedShift = response.data;
      this.events.forEach((e) => {
        const resource = e.resources.find(
          (r) => r.id === deletedShift.eventResourceId
        );
        if (resource) {
          resource.shifts = resource.shifts.filter(
            (u) => u.id !== deletedShift.id
          );
          return;
        }
      });
    },
    async updateShift(shift) {
      const response = await api.put(`/api/shifts/${shift.id}`, shift);
      const updatedShift = response.data;
      this.events.forEach((e) => {
        const resource = e.resources.find(
          (r) => r.id === updatedShift.eventResourceId
        );
        if (resource) {
          const shiftToUpdate = resource.shifts.find(
            (s) => s.id === updatedShift.id
          );
          shiftToUpdate.user = updatedShift.user;
          shiftToUpdate.startTime = updatedShift.startTime;
          shiftToUpdate.endTime = updatedShift.endTime;
          shiftToUpdate.comment = updatedShift.comment;
          return;
        }
      });
    },
    async getTemplates() {
      const response = await api.get("/api/templates");
      this.templates = response.data;
    },
    async addTemplate(template) {
      const response = await api.post("/api/templates", template);
    },
    async createTemplateFromEvent(eventId, name) {
      const response = await api.post(`/api/events/${eventId}/template`, {
        name: name,
      });
    },
    async createEventFromTemplate(templateId, date) {
      const response = await api.post(`/api/events/template/${templateId}`, {
        startDate: date,
      });
      this.events.push(response.data);
    },
  },
});
