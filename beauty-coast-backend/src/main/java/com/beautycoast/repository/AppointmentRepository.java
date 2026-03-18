package com.beautycoast.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beautycoast.model.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
}