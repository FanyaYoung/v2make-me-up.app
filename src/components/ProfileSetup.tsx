import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, User, Palette, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileSetupProps {
  onComplete: () => void;
}

interface ProfileData {
  ageRange: string;
  gender: string;
  ethnicity: Record<string, boolean>;
  lineage: Record<string, boolean>;
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | null;
  skinConcerns: string[];
  faceShape: string;
  preferredCoverage: string;
  preferredFinish: string;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    ageRange: '',
    gender: '',
    ethnicity: {},
    lineage: {},
    skinType: null,
    skinConcerns: [],
    faceShape: '',
    preferredCoverage: 'medium',
    preferredFinish: 'natural'
  });

  const ethnicityOptions = [
    'African American', 'Asian', 'Caucasian', 'Hispanic/Latino', 
    'Middle Eastern', 'Native American', 'Pacific Islander', 'Mixed/Other'
  ];

  const lineageOptions = [
    'West African', 'East African', 'North African', 'East Asian', 'Southeast Asian', 
    'South Asian', 'Northern European', 'Southern European', 'Mediterranean', 'Caribbean'
  ];

  const skinConcernOptions = [
    'Acne', 'Dark spots', 'Uneven tone', 'Redness', 'Dryness', 
    'Oiliness', 'Large pores', 'Fine lines', 'Hyperpigmentation'
  ];

  const handleEthnicityChange = (ethnicity: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      ethnicity: { ...prev.ethnicity, [ethnicity]: checked }
    }));
  };

  const handleLineageChange = (lineage: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      lineage: { ...prev.lineage, [lineage]: checked }
    }));
  };

  const handleSkinConcernToggle = (concern: string) => {
    setProfileData(prev => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(concern)
        ? prev.skinConcerns.filter(c => c !== concern)
        : [...prev.skinConcerns, concern]
    }));
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age_range: profileData.ageRange,
          gender: profileData.gender,
          ethnicity: profileData.ethnicity,
          lineage: profileData.lineage,
          skin_type: profileData.skinType,
          skin_concerns: profileData.skinConcerns,
          face_shape: profileData.faceShape,
          preferred_coverage: profileData.preferredCoverage,
          preferred_finish: profileData.preferredFinish,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile saved successfully!');
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      saveProfile();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 mx-auto mb-4 text-rose-500" />
        <h3 className="text-xl font-semibold">Basic Information</h3>
        <p className="text-gray-600">Let's start with some basic details about you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ageRange">Age Range</Label>
          <Select value={profileData.ageRange} onValueChange={(value) => 
            setProfileData(prev => ({ ...prev, ageRange: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18-24">18-24</SelectItem>
              <SelectItem value="25-34">25-34</SelectItem>
              <SelectItem value="35-44">35-44</SelectItem>
              <SelectItem value="45-54">45-54</SelectItem>
              <SelectItem value="55+">55+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={profileData.gender} onValueChange={(value) => 
            setProfileData(prev => ({ ...prev, gender: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Ethnicity (Select all that apply)</Label>
        <div className="grid grid-cols-2 gap-2">
          {ethnicityOptions.map((ethnicity) => (
            <div key={ethnicity} className="flex items-center space-x-2">
              <Checkbox
                id={`ethnicity-${ethnicity}`}
                checked={profileData.ethnicity[ethnicity] || false}
                onCheckedChange={(checked) => handleEthnicityChange(ethnicity, checked as boolean)}
              />
              <Label htmlFor={`ethnicity-${ethnicity}`} className="text-sm">
                {ethnicity}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Palette className="h-12 w-12 mx-auto mb-4 text-rose-500" />
        <h3 className="text-xl font-semibold">Skin & Heritage</h3>
        <p className="text-gray-600">Tell us about your skin and cultural background</p>
      </div>

      <div className="space-y-4">
        <Label>Cultural Lineage (Optional - helps with undertone prediction)</Label>
        <div className="grid grid-cols-2 gap-2">
          {lineageOptions.map((lineage) => (
            <div key={lineage} className="flex items-center space-x-2">
              <Checkbox
                id={`lineage-${lineage}`}
                checked={profileData.lineage[lineage] || false}
                onCheckedChange={(checked) => handleLineageChange(lineage, checked as boolean)}
              />
              <Label htmlFor={`lineage-${lineage}`} className="text-sm">
                {lineage}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="skinType">Skin Type</Label>
          <Select value={profileData.skinType || undefined} onValueChange={(value: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal') => 
            setProfileData(prev => ({ ...prev, skinType: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select skin type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oily">Oily</SelectItem>
              <SelectItem value="dry">Dry</SelectItem>
              <SelectItem value="combination">Combination</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="sensitive">Sensitive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="faceShape">Face Shape</Label>
          <Select value={profileData.faceShape} onValueChange={(value) => 
            setProfileData(prev => ({ ...prev, faceShape: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select face shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oval">Oval</SelectItem>
              <SelectItem value="round">Round</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="heart">Heart</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
              <SelectItem value="rectangle">Rectangle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Skin Concerns (Select all that apply)</Label>
        <div className="grid grid-cols-3 gap-2">
          {skinConcernOptions.map((concern) => (
            <div 
              key={concern} 
              className={`p-2 text-sm border rounded-lg cursor-pointer transition-colors ${
                profileData.skinConcerns.includes(concern)
                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => handleSkinConcernToggle(concern)}
            >
              {concern}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-rose-500" />
        <h3 className="text-xl font-semibold">Foundation Preferences</h3>
        <p className="text-gray-600">Help us understand your makeup preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="preferredCoverage">Preferred Coverage</Label>
          <Select value={profileData.preferredCoverage} onValueChange={(value) => 
            setProfileData(prev => ({ ...prev, preferredCoverage: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select coverage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="buildable">Buildable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredFinish">Preferred Finish</Label>
          <Select value={profileData.preferredFinish} onValueChange={(value) => 
            setProfileData(prev => ({ ...prev, preferredFinish: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select finish" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matte">Matte</SelectItem>
              <SelectItem value="satin">Satin</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
              <SelectItem value="dewy">Dewy</SelectItem>
              <SelectItem value="radiant">Radiant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-rose-50 p-4 rounded-lg">
        <h4 className="font-medium text-rose-900 mb-2">Why This Matters</h4>
        <p className="text-sm text-rose-700">
          Your profile helps our AI provide more accurate foundation matches based on your unique 
          characteristics and preferences. All information is kept private and secure.
        </p>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Complete Your Profile
          </span>
        </CardTitle>
        <CardDescription className="text-center">
          Help us provide the most accurate foundation matches for you
        </CardDescription>
        <div className="mt-4">
          <Progress value={(step / 3) * 100} className="w-full" />
          <p className="text-sm text-gray-500 text-center mt-2">
            Step {step} of 3
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        
        <div className="flex justify-between pt-6">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}
          
          <Button 
            onClick={nextStep}
            disabled={loading}
            className="ml-auto bg-gradient-to-r from-rose-500 to-purple-500"
          >
            {loading ? 'Saving...' : step === 3 ? 'Complete Profile' : 'Next'}
            {step < 3 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSetup;