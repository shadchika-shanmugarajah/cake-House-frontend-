import React from 'react';
import { Heart, Target, Eye, Users, Cake, Clock, Award, MapPin, Phone, Mail } from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <h1>About Cake House</h1>
          <p>Where every slice tells a story of passion, craftsmanship, and sweet memories</p>
        </div>

        {/* About Story Section */}
        <section className="about-story">
          <div className="story-content">
            <h2>Our Story</h2>
            <p>
              Founded in 2010 with a simple dream and a family recipe book, Cake House began as a small 
              neighborhood bakery. What started in a modest kitchen with just one oven has blossomed into 
              a beloved local institution, serving thousands of happy customers.
            </p>
            <p>
              Our founder, Sarah Thompson, believed that every celebration deserves a perfect cake. 
              Today, we continue her legacy by combining traditional baking techniques with innovative 
              designs, using only the finest ingredients to create cakes that not only look stunning 
              but taste incredible.
            </p>
          </div>
          <div className="story-image">
            <img 
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop" 
              alt="Cake House Bakery" 
            />
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="mission-vision-section">
          <div className="mission-card">
            <div className="mission-icon">
              <Target size={40} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To create unforgettable cake experiences by combining artisanal craftsmanship with 
              exceptional customer service. We strive to be the first choice for every celebration, 
              delivering quality, creativity, and joy in every slice.
            </p>
          </div>
          
          <div className="vision-card">
            <div className="vision-icon">
              <Eye size={40} />
            </div>
            <h3>Our Vision</h3>
            <p>
              To become the most trusted and innovative cake destination, setting industry standards 
              for quality and design while maintaining our commitment to community, sustainability, 
              and the art of traditional baking.
            </p>
          </div>
        </section>

        
        {/* Contact Info */}
        <section className="contact-info">
          <h2>Visit Us Today</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon">
                <MapPin size={24} />
              </div>
              <div className="contact-details">
                <h4>Our Location</h4>
                <p>123 Sweet Street, Cakeville</p>
                <p>Open: Mon-Sat 8am-8pm, Sun 9am-6pm</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">
                <Phone size={24} />
              </div>
              <div className="contact-details">
                <h4>Call Us</h4>
                <p>(123) 456-7890</p>
                <p>Orders & Inquiries</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <div className="contact-details">
                <h4>Email Us</h4>
                <p>orders@cakehouse.com</p>
                <p>Custom orders: custom@cakehouse.com</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;